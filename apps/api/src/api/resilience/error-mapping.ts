import { TRPCError } from "@trpc/server";

import { middleware } from "../setup";

/** Maps arbitrary caught values to {@link TRPCError} while preserving intentional TRPC failures. */
export function normalizeProcedureError(err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    cause: err,
  });
}

/**
 * Maps unknown errors to TRPCError. Add domain error classes from `@deck-pack/db` here later.
 */
export const errorMapperMiddleware = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    throw normalizeProcedureError(err);
  }
});
