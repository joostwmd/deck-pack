import { AppError } from "@deck-pack/errors";

export class LogoNotFoundError extends AppError {
  constructor(identifier: string, options?: { cause?: unknown }) {
    super("NOT_FOUND", `Logo not found: ${identifier}`, 404, options);
    this.name = "LogoNotFoundError";
  }
}

export class LogoRateLimitError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("TOO_MANY_REQUESTS", "Logo provider rate limit exceeded", 429, options);
    this.name = "LogoRateLimitError";
  }
}
