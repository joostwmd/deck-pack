import type { BillingRepository } from "@deck-pack/billing";
import type { OrganizationRepository } from "@deck-pack/organization";

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
import type { SeatsRepository } from "./seats-repository";

type SeedUser = {
  id: string;
  name: string;
  email: string;
  hasOrg: boolean;
  organizationId?: string;
};

type SeedOrg = {
  organizationId: string;
  purchased: number;
};

export class InMemorySeatsRepository implements SeatsRepository {
  private seats = new Map<string, OrganizationSeat>();
  private orgs = new Map<string, SeedOrg>();
  private users = new Map<string, SeedUser>();

  constructor(
    private readonly billing: BillingRepository,
    private readonly organization: OrganizationRepository,
  ) {
    void this.billing;
    void this.organization;
  }

  seed(input: { organizations?: SeedOrg[]; users?: SeedUser[]; seats?: OrganizationSeat[] }): void {
    for (const org of input.organizations ?? []) {
      this.orgs.set(org.organizationId, org);
    }
    for (const u of input.users ?? []) {
      this.users.set(u.email.toLowerCase(), { ...u, email: u.email.toLowerCase() });
    }
    for (const seat of input.seats ?? []) {
      this.seats.set(seat.seatId, seat);
    }
  }

  async capacity(organizationId: string): Promise<SeatCapacity> {
    const org = this.orgs.get(organizationId);
    const purchased = org?.purchased ?? 0;
    const used = [...this.seats.values()].filter(
      (s) =>
        s.organizationId === organizationId && (s.status === "pending" || s.status === "active"),
    ).length;
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
    const includeRevoked = options?.includeRevoked ?? false;
    return [...this.seats.values()]
      .filter((s) => s.organizationId === organizationId)
      .filter((s) => includeRevoked || s.status !== "revoked")
      .sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime());
  }

  async assign(input: AssignSeatInput): Promise<{ seatId: string }> {
    const org = this.orgs.get(input.organizationId);
    if (!org || org.purchased <= 0) {
      throw new NoSubscriptionError();
    }

    const capacity = await this.capacity(input.organizationId);
    if (capacity.used >= capacity.purchased) {
      throw new SeatAtCapacityError();
    }

    const email = input.email.toLowerCase().trim();
    const existingSeat = [...this.seats.values()].find(
      (s) =>
        s.organizationId === input.organizationId &&
        s.email === email &&
        (s.status === "pending" || s.status === "active"),
    );
    if (existingSeat) {
      throw new SeatEmailAlreadyAssignedError();
    }

    const existingUser = this.users.get(email);
    if (
      existingUser?.hasOrg &&
      existingUser.organizationId &&
      existingUser.organizationId !== input.organizationId
    ) {
      throw new UserInOtherOrganizationError();
    }

    const status: SeatStatus = existingUser ? "active" : "pending";
    const now = new Date();
    const seatId = crypto.randomUUID();
    const seat: OrganizationSeat = {
      seatId,
      organizationId: input.organizationId,
      email,
      userId: existingUser?.id ?? null,
      userName: existingUser?.name ?? null,
      status,
      assignedBy: input.assignedBy,
      assignedAt: now,
      activatedAt: status === "active" ? now : null,
      revokedAt: null,
    };
    this.seats.set(seatId, seat);

    if (existingUser && !existingUser.hasOrg) {
      this.users.set(email, {
        ...existingUser,
        hasOrg: true,
        organizationId: input.organizationId,
      });
    }

    return { seatId };
  }

  async revoke(input: RevokeSeatInput): Promise<{ seatId: string }> {
    const seat = this.seats.get(input.seatId);
    if (!seat || seat.organizationId !== input.organizationId) {
      throw new SeatNotFoundError(input.seatId);
    }
    if (seat.status === "revoked") {
      throw new SeatAlreadyRevokedError();
    }
    const now = new Date();
    this.seats.set(input.seatId, {
      ...seat,
      status: "revoked",
      revokedAt: now,
    });
    return { seatId: input.seatId };
  }

  async activateSeat(input: ActivateSeatInput): Promise<ActivateOrganizationSeatResult> {
    const seat = this.seats.get(input.seatId);
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
    this.seats.set(input.seatId, {
      ...seat,
      status: "active",
      userId: input.userId,
      activatedAt: now,
    });

    return {
      ok: true,
      seatId: seat.seatId,
      organizationId: seat.organizationId,
      userId: input.userId,
      email: seat.email,
    };
  }

  async findPendingSeatByEmail(email: string): Promise<PendingSeatByEmail> {
    const normalizedEmail = email.toLowerCase().trim();
    const seat = [...this.seats.values()].find(
      (s) => s.email === normalizedEmail && (s.status === "pending" || s.status === "active"),
    );
    if (!seat) return null;
    return {
      seatId: seat.seatId,
      organizationId: seat.organizationId,
      email: seat.email,
      status: seat.status,
    };
  }

  async hasActiveSeat(input: { organizationId: string; userId: string }): Promise<boolean> {
    return [...this.seats.values()].some(
      (s) =>
        s.organizationId === input.organizationId &&
        s.userId === input.userId &&
        s.status === "active",
    );
  }
}
