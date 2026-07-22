import { AppError } from "@deck-pack/errors";

export class FlagNotFoundError extends AppError {
  constructor(identifier: string, options?: { cause?: unknown }) {
    super("NOT_FOUND", `Flag not found: ${identifier}`, 404, options);
    this.name = "FlagNotFoundError";
  }
}
