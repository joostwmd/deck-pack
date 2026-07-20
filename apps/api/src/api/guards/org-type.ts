import { TRPCError } from "@trpc/server";

import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import {
  isIndividualOrganization,
  isTeamOrganization,
} from "@deck-pack/db/org-metadata";
import {
  isWorkspaceKind,
  workspaceFromOrganizationMetadata,
  type WorkspaceKind,
} from "@deck-pack/auth/workspace";

import { requireActiveOrganizationId } from "./org-context";
import { middleware } from "../setup";
import type { Context } from "../context";

async function resolveWorkspaceKind(ctx: Context): Promise<WorkspaceKind> {
  const sessionWorkspace = ctx.session?.session?.workspace;
  if (isWorkspaceKind(sessionWorkspace)) {
    return sessionWorkspace;
  }

  const organizationId = requireActiveOrganizationId(ctx);
  const org = await getOrganizationMetadataById({
    tx: ctx.tx,
    organizationId,
  });

  if (!org) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  const workspace = workspaceFromOrganizationMetadata(org.metadata);
  if (!workspace) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization workspace type is not configured",
    });
  }

  return workspace;
}

export const requireTeamWorkspace = middleware<Context>(async ({ ctx, next }) => {
  const workspace = await resolveWorkspaceKind(ctx);

  if (workspace !== "team") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for team workspaces",
    });
  }

  return next({ ctx });
});

export const requireSoloWorkspace = middleware<Context>(async ({ ctx, next }) => {
  const workspace = await resolveWorkspaceKind(ctx);

  if (workspace !== "solo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for solo workspaces",
    });
  }

  return next({ ctx });
});

/** @deprecated Prefer requireTeamWorkspace */
export const requireTeamOrganization = requireTeamWorkspace;

export async function assertTeamOrganizationById(
  tx: Context["tx"],
  organizationId: string,
): Promise<void> {
  const org = await getOrganizationMetadataById({ tx, organizationId });

  if (!org || !isTeamOrganization(org.metadata)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for team organizations",
    });
  }
}

export async function assertSoloOrganizationById(
  tx: Context["tx"],
  organizationId: string,
): Promise<void> {
  const org = await getOrganizationMetadataById({ tx, organizationId });

  if (!org || !isIndividualOrganization(org.metadata)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for solo workspaces",
    });
  }
}
