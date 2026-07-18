import type { PexelsRateLimitInfo } from "./types";

export class PexelsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PexelsError";
  }
}

export class PexelsAuthError extends PexelsError {
  constructor() {
    super("Pexels API authentication failed");
    this.name = "PexelsAuthError";
  }
}

export class PexelsRateLimitError extends PexelsError {
  readonly rateLimit: PexelsRateLimitInfo;

  constructor(rateLimit: PexelsRateLimitInfo) {
    const resetMessage =
      rateLimit.reset != null
        ? ` Try again after ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}.`
        : "";

    super(`Pexels API rate limit exceeded.${resetMessage}`);
    this.name = "PexelsRateLimitError";
    this.rateLimit = rateLimit;
  }
}

export class PexelsUpstreamError extends PexelsError {
  readonly status: number;

  constructor(status: number) {
    super(`Pexels API request failed with status ${status}`);
    this.name = "PexelsUpstreamError";
    this.status = status;
  }
}

export class PexelsNetworkError extends PexelsError {
  constructor(cause?: unknown) {
    super("Failed to reach Pexels API");
    this.name = "PexelsNetworkError";
    this.cause = cause;
  }
}
