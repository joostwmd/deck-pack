import { TRPCError } from "@trpc/server";

import { isOrganizationMember as isOrganizationMemberQuery } from "@deck-pack/db/queries/isOrganizationMember";

import type { Context } from "../../context";
import { middleware } from "../../init";

/** Requires the caller to be a member of the session's active organization. */
export const requireOrganizationMembership = middleware<Context>(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!ctx.session.session?.activeOrganizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization set",
    });
  }

  const isMember = await isOrganizationMemberQuery({
    tx: ctx.tx,
    userId: ctx.session.user.id,
    organizationId: ctx.session.session.activeOrganizationId,
  });

  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  return next({ ctx });
});
