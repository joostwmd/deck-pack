import { TRPCError } from "@trpc/server";

export type ServiceErrorCode =
  | "not_found"
  | "conflict"
  | "forbidden"
  | "invalid_state"
  | "internal";

export type ServiceSuccess<T> = {
  ok: true;
  data: T;
};

export type ServiceFailure = {
  ok: false;
  code: ServiceErrorCode;
  message?: string;
  details?: unknown;
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export function serviceOk<T>(data: T): ServiceSuccess<T> {
  return { ok: true, data };
}

export function serviceFail(
  code: ServiceErrorCode,
  options?: { message?: string; details?: unknown },
): ServiceFailure {
  return {
    ok: false,
    code,
    message: options?.message,
    details: options?.details,
  };
}

const SERVICE_ERROR_TO_TRPC: Record<
  ServiceErrorCode,
  TRPCError["code"]
> = {
  not_found: "NOT_FOUND",
  conflict: "CONFLICT",
  forbidden: "FORBIDDEN",
  invalid_state: "BAD_REQUEST",
  internal: "INTERNAL_SERVER_ERROR",
};

const DEFAULT_MESSAGES: Record<ServiceErrorCode, string> = {
  not_found: "Resource not found",
  conflict: "Conflict",
  forbidden: "Forbidden",
  invalid_state: "Invalid state",
  internal: "An unexpected error occurred",
};

/** Maps a service-layer failure union to a {@link TRPCError} for tRPC routes. */
export function toTrpcError(failure: ServiceFailure): TRPCError {
  return new TRPCError({
    code: SERVICE_ERROR_TO_TRPC[failure.code],
    message: failure.message ?? DEFAULT_MESSAGES[failure.code],
    cause: failure.details,
  });
}

/** Unwraps a successful {@link ServiceResult}; throws {@link TRPCError} on failure. */
export function unwrapServiceResult<T>(result: ServiceResult<T>): T {
  if (!result.ok) {
    throw toTrpcError(result);
  }
  return result.data;
}
