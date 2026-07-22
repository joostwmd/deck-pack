import { AppError } from "@deck-pack/errors";

export class NoSubscriptionError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("NO_SUBSCRIPTION", "Organization has no active subscription", 400, options);
    this.name = "NoSubscriptionError";
  }
}

export class SeatAtCapacityError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("SEAT_AT_CAPACITY", "All purchased seats are assigned", 409, options);
    this.name = "SeatAtCapacityError";
  }
}

export class SeatEmailAlreadyAssignedError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("SEAT_EMAIL_ALREADY_ASSIGNED", "This email already has a seat assignment", 409, options);
    this.name = "SeatEmailAlreadyAssignedError";
  }
}

export class UserInOtherOrganizationError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super(
      "USER_IN_OTHER_ORGANIZATION",
      "User already belongs to another organization",
      409,
      options,
    );
    this.name = "UserInOtherOrganizationError";
  }
}

export class SeatNotFoundError extends AppError {
  constructor(seatId: string, options?: { cause?: unknown }) {
    super("SEAT_NOT_FOUND", `Seat ${seatId} not found`, 404, options);
    this.name = "SeatNotFoundError";
  }
}

export class SeatAlreadyRevokedError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("SEAT_ALREADY_REVOKED", "Seat is already revoked", 400, options);
    this.name = "SeatAlreadyRevokedError";
  }
}

export class AssignedSeatMissingError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("ASSIGNED_SEAT_MISSING", "Assigned seat not found after assignment", 500, options);
    this.name = "AssignedSeatMissingError";
  }
}
