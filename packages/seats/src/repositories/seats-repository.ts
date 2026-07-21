import { and, asc, eq, inArray } from "drizzle-orm";
import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";
import { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import { countAssignedSeats } from "@deck-pack/db/queries/countAssignedSeats";
import { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import { revokeOrganizationSeat } from "@deck-pack/db/queries/revokeOrganizationSeat";
import { user } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import {
  NoSubscriptionError,
  SeatAlreadyRevokedError,
  SeatAtCapacityError,
  SeatEmailAlreadyAssignedError,
  SeatNotFoundError,
  UserInOtherOrganizationError,
} from "../domain/errors";
import type {
  AssignSeatInput,
  OrganizationSeat,
  RevokeSeatInput,
  SeatCapacity,
  SeatStatus,
} from "../domain/seat";

export interface SeatsRepository {
  capacity(organizationId: string): Promise<SeatCapacity>;
  list(organizationId: string, options?: { includeRevoked?: boolean }): Promise<OrganizationSeat[]>;
  assign(input: AssignSeatInput): Promise<{ seatId: string }>;
  revoke(input: RevokeSeatInput): Promise<{ seatId: string }>;
}

export class DrizzleSeatsRepository implements SeatsRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async capacity(organizationId: string): Promise<SeatCapacity> {
    const tx = this.tx();
    const subscription = await getActiveOrganizationSubscriptionByOrgId({
      tx,
      organizationId,
    });
    const purchased = subscription?.quantity ?? 0;
    const used = await countAssignedSeats({ tx, organizationId });
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
    const tx = this.tx();
    const includeRevoked = options?.includeRevoked ?? false;
    const statuses = includeRevoked ? ["pending", "active", "revoked"] : ["pending", "active"];

    const rows = await tx
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
    const tx = this.tx();
    const existingUser = await findUserByEmail({ tx, email: input.email });

    const result = await assignOrganizationSeat({
      tx,
      input: {
        organizationId: input.organizationId,
        email: input.email,
        assignedBy: input.assignedBy,
        userId: existingUser?.id ?? null,
        status: existingUser ? "active" : "pending",
      },
    });

    if (!result.ok) {
      switch (result.reason) {
        case "no_subscription":
          throw new NoSubscriptionError();
        case "at_capacity":
          throw new SeatAtCapacityError();
        case "email_already_assigned":
          throw new SeatEmailAlreadyAssignedError();
        case "user_in_other_org":
          throw new UserInOtherOrganizationError();
      }
    }

    if (existingUser && !existingUser.hasOrg) {
      await addOrganizationMember({
        tx,
        input: {
          organizationId: input.organizationId,
          userId: existingUser.id,
          role: ORGANIZATION_ROLES.addinUser,
        },
      });
    }

    return { seatId: result.seatId };
  }

  async revoke(input: RevokeSeatInput): Promise<{ seatId: string }> {
    const tx = this.tx();
    const result = await revokeOrganizationSeat({
      tx,
      seatId: input.seatId,
      organizationId: input.organizationId,
    });

    if (!result.ok) {
      if (result.reason === "not_found") {
        throw new SeatNotFoundError(input.seatId);
      }
      throw new SeatAlreadyRevokedError();
    }

    return { seatId: result.seatId };
  }
}
