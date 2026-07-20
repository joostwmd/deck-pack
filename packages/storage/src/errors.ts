export class StorageError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "StorageError";
    this.code = code;
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(key: string, options?: { cause?: unknown }) {
    super("NOT_FOUND", `Object not found: ${key}`, options);
    this.name = "StorageNotFoundError";
  }
}

export class StorageConfigError extends StorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("CONFIG", message, options);
    this.name = "StorageConfigError";
  }
}

export class StorageProviderError extends StorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("PROVIDER", message, options);
    this.name = "StorageProviderError";
  }
}
