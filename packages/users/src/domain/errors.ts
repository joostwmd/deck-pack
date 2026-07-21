import { AppError } from "@deck-pack/errors";

export class UserNotFoundError extends AppError {
  constructor(userId: string, options?: { cause?: unknown }) {
    super("USER_NOT_FOUND", `User ${userId} not found`, 404, options);
    this.name = "UserNotFoundError";
  }
}

export class CannotDeleteSelfError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("CANNOT_DELETE_SELF", "You cannot delete your own account", 400, options);
    this.name = "CannotDeleteSelfError";
  }
}
