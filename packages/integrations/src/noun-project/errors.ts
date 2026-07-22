export class NounProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NounProjectError";
  }
}

export class NounProjectAuthError extends NounProjectError {
  constructor() {
    super("Noun Project API authentication failed");
    this.name = "NounProjectAuthError";
  }
}

export class NounProjectRateLimitError extends NounProjectError {
  constructor() {
    super("Noun Project API rate limit exceeded");
    this.name = "NounProjectRateLimitError";
  }
}

export class NounProjectNotFoundError extends NounProjectError {
  constructor(identifier: string) {
    super(`Noun Project icon not found: ${identifier}`);
    this.name = "NounProjectNotFoundError";
  }
}

export class NounProjectUpstreamError extends NounProjectError {
  readonly status: number;

  constructor(status: number) {
    super(`Noun Project API request failed with status ${status}`);
    this.name = "NounProjectUpstreamError";
    this.status = status;
  }
}

export class NounProjectNetworkError extends NounProjectError {
  constructor(cause?: unknown) {
    super("Failed to reach Noun Project API");
    this.name = "NounProjectNetworkError";
    this.cause = cause;
  }
}
