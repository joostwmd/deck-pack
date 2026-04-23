import { TRPCError } from "@trpc/server";
import { middleware } from "../setup";
import type { Context } from "../context";

import { isOrganizationMember as isOrganizationMemberQuery } from "@deck-pack/db/queries/isOrganizationMember";
import { isPlatformAdmin as isPlatformAdminQuery } from "@deck-pack/db/queries/isPlatformAdmin";
import { auth } from "@deck-pack/auth/server";

export const isOrganizationMember = middleware<Context>(async ({ ctx, next }) => {
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

export const isPlatformAdmin = middleware<Context>(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const isAdmin = await isPlatformAdminQuery({ tx: ctx.tx, userId: ctx.session.user.id });

  if (!isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a platform admin",
    });
  }

  return next({ ctx });
});

// Helper to check permissions and throw if insufficient
export async function hasPermission(headers: Headers, permissions: Record<string, string[]>) {
  try {
    const result = await auth.api.hasPermission({
      headers,
      body: { permissions },
    });

    if (!result.success) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to perform this operation",
      });
    }
  } catch {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to perform this operation",
    });
  }
}
