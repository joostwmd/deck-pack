export const SEAT_STATUSES = ["pending", "active", "revoked"] as const;
export type SeatStatus = (typeof SEAT_STATUSES)[number];

export type OrganizationSeat = {
  seatId: string;
  organizationId: string;
  email: string;
  userId: string | null;
  userName: string | null;
  status: SeatStatus;
  assignedBy: string;
  assignedAt: Date;
  activatedAt: Date | null;
  revokedAt: Date | null;
};

export type SeatCapacity = {
  purchased: number;
  used: number;
  remaining: number;
};

export type AssignSeatInput = {
  organizationId: string;
  email: string;
  assignedBy: string;
};

export type RevokeSeatInput = {
  organizationId: string;
  seatId: string;
};

export type ActivateSeatInput = {
  seatId: string;
  userId: string;
};

export type ActivateOrganizationSeatResult =
  | {
      ok: true;
      seatId: string;
      organizationId: string;
      userId: string;
      email: string;
    }
  | { ok: false; reason: "not_found" | "already_active" | "revoked" };

export type PendingSeatByEmail = {
  seatId: string;
  organizationId: string;
  email: string;
  status: SeatStatus;
} | null;
