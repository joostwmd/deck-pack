import { AppError } from "@deck-pack/errors";

export class PhotoRateLimitError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("TOO_MANY_REQUESTS", "Photo provider rate limit exceeded", 429, options);
    this.name = "PhotoRateLimitError";
  }
}
