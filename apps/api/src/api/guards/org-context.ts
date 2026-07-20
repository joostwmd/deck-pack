import { TRPCError } from "@trpc/server";

import type { Context } from "../context";

export function requireActiveOrganizationId(ctx: Context): string {
  const organizationId = ctx.session?.session?.activeOrganizationId;

  if (!organizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization set",
    });
  }

  return organizationId;
}
