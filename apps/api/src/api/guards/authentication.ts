import { TRPCError } from "@trpc/server";

import type { SessionPayload } from "../../types";
import { middleware } from "../setup";

/**
 * Asserts a signed-in session. Does not call Better Auth again — uses Hono-populated context.
 */
export const isAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const session = ctx.session as SessionPayload;

  return next({
    ctx: {
      ...ctx,
      session,
      user: session.user,
    },
  });
});
