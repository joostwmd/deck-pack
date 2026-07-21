import { AppError } from "@deck-pack/errors";

export class IconNotFoundError extends AppError {
  constructor(identifier: string, options?: { cause?: unknown }) {
    super("NOT_FOUND", `Icon not found: ${identifier}`, 404, options);
    this.name = "IconNotFoundError";
  }
}

export class IconRateLimitError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("TOO_MANY_REQUESTS", "Icon provider rate limit exceeded", 429, options);
    this.name = "IconRateLimitError";
  }
}
