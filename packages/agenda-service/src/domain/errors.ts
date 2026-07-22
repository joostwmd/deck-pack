import { AppError } from "@deck-pack/errors";

export class AgendaNotFoundError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("NOT_FOUND", "Agenda not found", 404, options);
    this.name = "AgendaNotFoundError";
  }
}

export class AgendaSyncFailedError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("INTERNAL", "Failed to sync agenda", 500, options);
    this.name = "AgendaSyncFailedError";
  }
}
