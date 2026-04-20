import { TRPCError } from "@trpc/server";

import { isAuthenticated } from "./authentication";

/** Example role gate — extend when your user model exposes roles. */
export const isAdmin = isAuthenticated.unstable_pipe(({ ctx, next }) => {
  const role = (ctx.user as { role?: string }).role;
  if (role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires admin privileges",
    });
  }
  return next({ ctx });
});
