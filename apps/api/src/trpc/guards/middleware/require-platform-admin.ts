import { TRPCError } from "@trpc/server";

import type { Context } from "../../context";
import { middleware } from "../../init";

/** Requires the caller to be a platform admin. */
export const requirePlatformAdmin = middleware<Context>(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const isAdmin = await ctx.users.isPlatformAdmin(ctx.session.user.id);

  if (!isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a platform admin",
    });
  }

  return next({ ctx });
});
