import { TRPCError } from "@trpc/server";

import { hasActiveSeat } from "@deck-pack/db/queries/activateOrganizationSeat";
import { isOrganizationMember } from "@deck-pack/db/queries/isOrganizationMember";

import type { Context } from "../../context";
import { middleware } from "../../init";
import { requireActiveOrganizationId } from "../assertions/require-active-organization-id";

/** Requires the caller to hold an active add-in seat in the current organization. */
export const requireActiveSeat = middleware<Context>(async ({ ctx, next }) => {
  const organizationId = requireActiveOrganizationId(ctx);
  const userId = ctx.session!.user.id;

  const isMember = await isOrganizationMember({
    tx: ctx.tx,
    userId,
    organizationId,
  });

  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  const seated = await hasActiveSeat({
    tx: ctx.tx,
    organizationId,
    userId,
  });

  if (!seated) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "An active add-in seat is required for this operation",
    });
  }

  return next({ ctx });
});
