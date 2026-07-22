export type {
  AssignSeatInput,
  OrganizationSeat,
  RevokeSeatInput,
  SeatCapacity,
  SeatStatus,
} from "./domain/seat";
export { SEAT_STATUSES } from "./domain/seat";

export {
  AssignedSeatMissingError,
  NoSubscriptionError,
  SeatAlreadyRevokedError,
  SeatAtCapacityError,
  SeatEmailAlreadyAssignedError,
  SeatNotFoundError,
  UserInOtherOrganizationError,
} from "./domain/errors";

export type { SeatsRepository } from "./repositories/seats-repository";

export { GetSeatCapacity } from "./use-cases/get-seat-capacity";
export { ListSeats } from "./use-cases/list-seats";
export { AssignSeat } from "./use-cases/assign-seat";
export { RevokeSeat } from "./use-cases/revoke-seat";
