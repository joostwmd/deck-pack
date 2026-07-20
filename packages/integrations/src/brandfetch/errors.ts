export class BrandfetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrandfetchError";
  }
}

export class BrandfetchAuthError extends BrandfetchError {
  constructor() {
    super("Brandfetch API authentication failed");
    this.name = "BrandfetchAuthError";
  }
}

export class BrandfetchRateLimitError extends BrandfetchError {
  constructor() {
    super("Brandfetch API rate limit exceeded");
    this.name = "BrandfetchRateLimitError";
  }
}

export class BrandfetchNotFoundError extends BrandfetchError {
  constructor(identifier: string) {
    super(`Brand not found: ${identifier}`);
    this.name = "BrandfetchNotFoundError";
  }
}

export class BrandfetchUpstreamError extends BrandfetchError {
  readonly status: number;

  constructor(status: number) {
    super(`Brandfetch API request failed with status ${status}`);
    this.name = "BrandfetchUpstreamError";
    this.status = status;
  }
}

export class BrandfetchNetworkError extends BrandfetchError {
  constructor(cause?: unknown) {
    super("Failed to reach Brandfetch API");
    this.name = "BrandfetchNetworkError";
    this.cause = cause;
  }
}
