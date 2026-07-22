export type SeatStatus = "pending" | "active" | "revoked";

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
