import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";
import { member, user } from "@deck-pack/db/schema/auth";
import { organizationSeats, organizationSubscriptions } from "@deck-pack/db/schema/billing";
import type { UnitOfWork } from "@deck-pack/db";

import {
  NoSubscriptionError,
  SeatAlreadyRevokedError,
  SeatAtCapacityError,
  SeatEmailAlreadyAssignedError,
  SeatNotFoundError,
  UserInOtherOrganizationError,
} from "../domain/errors";
import type {
  ActivateOrganizationSeatResult,
  ActivateSeatInput,
  AssignSeatInput,
  OrganizationSeat,
  PendingSeatByEmail,
  RevokeSeatInput,
  SeatCapacity,
  SeatStatus,
} from "../domain/seat";

export interface SeatsRepository {
  capacity(organizationId: string): Promise<SeatCapacity>;
  list(organizationId: string, options?: { includeRevoked?: boolean }): Promise<OrganizationSeat[]>;
  assign(input: AssignSeatInput): Promise<{ seatId: string }>;
  revoke(input: RevokeSeatInput): Promise<{ seatId: string }>;
  activateSeat(input: ActivateSeatInput): Promise<ActivateOrganizationSeatResult>;
  findPendingSeatByEmail(email: string): Promise<PendingSeatByEmail>;
  hasActiveSeat(input: { organizationId: string; userId: string }): Promise<boolean>;
}

export class DrizzleSeatsRepository implements SeatsRepository {
  constructor(private readonly uow: UnitOfWork) {}

  /**
   * Duplicated read of the active org subscription (also owned by billing/members/usage
   * repos). Kept as an inline copy for now to avoid cross-domain DI churn.
   */
  private async findActiveSubscription(
    organizationId: string,
  ): Promise<{ quantity: number } | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ quantity: organizationSubscriptions.quantity })
      .from(organizationSubscriptions)
      .where(
        and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async countAssignedSeats(organizationId: string): Promise<number> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ value: count() })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.organizationId, organizationId),
          inArray(organizationSeats.status, ["pending", "active"]),
        ),
      );

    return Number(row?.value ?? 0);
  }

  /** Duplicated read of user-by-email (also owned by members repo). */
  private async findUserByEmail(
    email: string,
  ): Promise<{ id: string; name: string; email: string; hasOrg: boolean } | null> {
    const db = this.uow.getDb();
    const normalizedEmail = email.toLowerCase();

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      .limit(1);

    if (!row) {
      return null;
    }

    const memberships = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.userId, row.id))
      .limit(1);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      hasOrg: memberships.length > 0,
    };
  }

  /** Duplicated write of add-member (also owned by members repo). */
  private async addOrganizationMember(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<void> {
    const db = this.uow.getDb();
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      createdAt: new Date(),
    });
  }

  async capacity(organizationId: string): Promise<SeatCapacity> {
    const subscription = await this.findActiveSubscription(organizationId);
    const purchased = subscription?.quantity ?? 0;
    const used = await this.countAssignedSeats(organizationId);
    return {
      purchased,
      used,
      remaining: Math.max(0, purchased - used),
    };
  }

  async list(
    organizationId: string,
    options?: { includeRevoked?: boolean },
  ): Promise<OrganizationSeat[]> {
    const db = this.uow.getDb();
    const includeRevoked = options?.includeRevoked ?? false;
    const statuses = includeRevoked ? ["pending", "active", "revoked"] : ["pending", "active"];

    const rows = await db
      .select({
        seatId: organizationSeats.id,
        organizationId: organizationSeats.organizationId,
        email: organizationSeats.email,
        userId: organizationSeats.userId,
        userName: user.name,
        status: organizationSeats.status,
        assignedBy: organizationSeats.assignedBy,
        assignedAt: organizationSeats.assignedAt,
        activatedAt: organizationSeats.activatedAt,
        revokedAt: organizationSeats.revokedAt,
      })
      .from(organizationSeats)
      .leftJoin(user, eq(organizationSeats.userId, user.id))
      .where(
        and(
          eq(organizationSeats.organizationId, organizationId),
          inArray(organizationSeats.status, statuses),
        ),
      )
      .orderBy(asc(organizationSeats.assignedAt));

    return rows.map((row) => ({
      ...row,
      status: row.status as SeatStatus,
    }));
  }

  async assign(input: AssignSeatInput): Promise<{ seatId: string }> {
    const db = this.uow.getDb();
    const normalizedEmail = input.email.toLowerCase().trim();

    const subscription = await this.findActiveSubscription(input.organizationId);
    if (!subscription) {
      throw new NoSubscriptionError();
    }

    const assignedCount = await this.countAssignedSeats(input.organizationId);
    if (assignedCount >= subscription.quantity) {
      throw new SeatAtCapacityError();
    }

    const [existingSeat] = await db
      .select({ id: organizationSeats.id })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
          inArray(organizationSeats.status, ["pending", "active"]),
        ),
      )
      .limit(1);

    if (existingSeat) {
      throw new SeatEmailAlreadyAssignedError();
    }

    const existingUser = await this.findUserByEmail(normalizedEmail);

    if (existingUser) {
      const [otherMembership] = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .where(eq(member.userId, existingUser.id))
        .limit(1);

      if (otherMembership && otherMembership.organizationId !== input.organizationId) {
        throw new UserInOtherOrganizationError();
      }
    }

    const status: SeatStatus = existingUser ? "active" : "pending";
    const now = new Date();

    const [row] = await db
      .insert(organizationSeats)
      .values({
        organizationId: input.organizationId,
        email: normalizedEmail,
        userId: existingUser?.id ?? null,
        status,
        assignedBy: input.assignedBy,
        assignedAt: now,
        activatedAt: status === "active" ? now : null,
      })
      .returning({ seatId: organizationSeats.id });

    if (!row) {
      throw new Error("Failed to assign organization seat");
    }

    if (existingUser && !existingUser.hasOrg) {
      await this.addOrganizationMember({
        organizationId: input.organizationId,
        userId: existingUser.id,
        role: ORGANIZATION_ROLES.addinUser,
      });
    }

    return { seatId: row.seatId };
  }

  async revoke(input: RevokeSeatInput): Promise<{ seatId: string }> {
    const db = this.uow.getDb();
    const [seat] = await db
      .select({ id: organizationSeats.id, status: organizationSeats.status })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.id, input.seatId),
          eq(organizationSeats.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!seat) {
      throw new SeatNotFoundError(input.seatId);
    }

    if (seat.status === "revoked") {
      throw new SeatAlreadyRevokedError();
    }

    const now = new Date();
    await db
      .update(organizationSeats)
      .set({
        status: "revoked",
        revokedAt: now,
        updatedAt: now,
      })
      .where(eq(organizationSeats.id, input.seatId));

    return { seatId: input.seatId };
  }

  async activateSeat(input: ActivateSeatInput): Promise<ActivateOrganizationSeatResult> {
    const db = this.uow.getDb();
    const [seat] = await db
      .select({
        id: organizationSeats.id,
        organizationId: organizationSeats.organizationId,
        email: organizationSeats.email,
        status: organizationSeats.status,
      })
      .from(organizationSeats)
      .where(eq(organizationSeats.id, input.seatId))
      .limit(1);

    if (!seat) {
      return { ok: false, reason: "not_found" };
    }

    if (seat.status === "revoked") {
      return { ok: false, reason: "revoked" };
    }

    if (seat.status === "active") {
      return { ok: false, reason: "already_active" };
    }

    const now = new Date();
    await db
      .update(organizationSeats)
      .set({
        status: "active",
        userId: input.userId,
        activatedAt: now,
        updatedAt: now,
      })
      .where(eq(organizationSeats.id, input.seatId));

    return {
      ok: true,
      seatId: seat.id,
      organizationId: seat.organizationId,
      userId: input.userId,
      email: seat.email,
    };
  }

  async findPendingSeatByEmail(email: string): Promise<PendingSeatByEmail> {
    const db = this.uow.getDb();
    const normalizedEmail = email.toLowerCase().trim();

    const [row] = await db
      .select({
        seatId: organizationSeats.id,
        organizationId: organizationSeats.organizationId,
        email: organizationSeats.email,
        status: organizationSeats.status,
      })
      .from(organizationSeats)
      .where(
        and(
          sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
          inArray(organizationSeats.status, ["pending", "active"]),
        ),
      )
      .limit(1);

    if (!row) return null;

    return { ...row, status: row.status as SeatStatus };
  }

  async hasActiveSeat(input: { organizationId: string; userId: string }): Promise<boolean> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ id: organizationSeats.id })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          eq(organizationSeats.userId, input.userId),
          eq(organizationSeats.status, "active"),
        ),
      )
      .limit(1);

    return Boolean(row);
  }
}
