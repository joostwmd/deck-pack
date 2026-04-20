import { TRPCError } from "@trpc/server";

import { middleware } from "../setup";

/**
 * Maps unknown errors to TRPCError. Add domain error classes from `@deck-pack/db` here later.
 */
export const errorMapperMiddleware = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      cause: err,
    });
  }
});
