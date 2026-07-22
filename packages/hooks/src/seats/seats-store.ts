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

export type SeatCapacity = {
  purchased: number;
  used: number;
  remaining: number;
};

export interface SeatsStore {
  capacity: () => Promise<SeatCapacity>;
  list: () => Promise<OrganizationSeat[]>;
  assign: (input: { email: string }) => Promise<OrganizationSeat>;
  revoke: (input: { seatId: string }) => Promise<{ seatId: string }>;
}

/** Duck-typed surface of `trpc.seats`. */
export type SeatsTrpcApi = {
  capacity: { query: () => Promise<SeatCapacity> };
  list: { query: () => Promise<OrganizationSeat[]> };
  assign: { mutate: (input: unknown) => Promise<OrganizationSeat> };
  revoke: { mutate: (input: unknown) => Promise<{ seatId: string }> };
};

export function createTrpcSeatsStore(api: SeatsTrpcApi): SeatsStore {
  return {
    capacity: () => api.capacity.query(),
    list: () => api.list.query(),
    assign: (input) => api.assign.mutate(input),
    revoke: (input) => api.revoke.mutate(input),
  };
}
