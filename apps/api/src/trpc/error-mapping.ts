import { AppError } from "@deck-pack/errors";
import { TRPCError } from "@trpc/server";

import { middleware } from "../setup";

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
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/** Maps arbitrary caught values to {@link TRPCError} while preserving intentional TRPC failures. */
export function normalizeProcedureError(err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;

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
 */
export const errorMapperMiddleware = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    throw normalizeProcedureError(err);
  }
});
