export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("NOT_FOUND", message, 404, options);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("CONFLICT", message, 409, options);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("FORBIDDEN", message, 403, options);
    this.name = "ForbiddenError";
  }
}

export class InvalidStateError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("INVALID_STATE", message, 400, options);
    this.name = "InvalidStateError";
  }
}
