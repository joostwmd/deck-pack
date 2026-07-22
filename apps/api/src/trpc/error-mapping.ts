import { AppError } from "@deck-pack/errors";
import { TRPCError } from "@trpc/server";

import { middleware } from "./init";

function appErrorToTrpcCode(error: AppError): TRPCError["code"] {
  switch (error.httpStatus) {
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 403:
      return "FORBIDDEN";
    case 400:
      return "BAD_REQUEST";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Maps arbitrary caught values to {@link TRPCError} while preserving intentional TRPC failures.
 *
 * tRPC v11 converts procedure throws via `getTRPCErrorFromUnknown` before middleware sees them,
 * so AppErrors often arrive already wrapped as INTERNAL_SERVER_ERROR with `cause` set. Remap those.
 */
export function normalizeProcedureError(err: unknown): TRPCError {
  if (err instanceof TRPCError) {
    if (err.code === "INTERNAL_SERVER_ERROR" && err.cause instanceof AppError) {
      return new TRPCError({
        code: appErrorToTrpcCode(err.cause),
        message: err.cause.message,
        cause: err.cause,
      });
    }
    return err;
  }

  if (err instanceof AppError) {
    return new TRPCError({
      code: appErrorToTrpcCode(err),
      message: err.message,
      cause: err,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    cause: err,
  });
}

/**
 * Maps unknown errors to TRPCError, including {@link AppError} subclasses from `@deck-pack/errors`.
 *
 * Procedure failures are returned as `{ ok: false, error }` (not thrown) in tRPC v11, so we
 * inspect the middleware result instead of relying on try/catch alone.
 */
export const errorMapperMiddleware = middleware(async ({ next }) => {
  try {
    const result = await next();
    if (!result.ok) {
      const normalized = normalizeProcedureError(result.error);
      if (normalized !== result.error) {
        return { ...result, error: normalized };
      }
    }
    return result;
  } catch (err) {
    throw normalizeProcedureError(err);
  }
});
