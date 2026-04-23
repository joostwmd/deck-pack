import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import { middleware } from "../setup";

/**
 * Asserts a signed-in session. Does not call Better Auth again — uses Hono-populated context.
 */
export const isAuthenticated = middleware<Context>(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session! } });
});
