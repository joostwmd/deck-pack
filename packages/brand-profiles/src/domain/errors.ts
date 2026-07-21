import { AppError } from "@deck-pack/errors";

export class BrandProfileNotFoundError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("NOT_FOUND", "Brand profile not found", 404, options);
    this.name = "BrandProfileNotFoundError";
  }
}
