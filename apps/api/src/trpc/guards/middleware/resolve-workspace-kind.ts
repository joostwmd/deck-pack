import { TRPCError } from "@trpc/server";

import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import {
  isWorkspaceKind,
  workspaceFromOrganizationMetadata,
  type WorkspaceKind,
} from "@deck-pack/auth/workspace";

import type { Context } from "../../context";
import { requireActiveOrganizationId } from "../assertions/require-active-organization-id";

export async function resolveWorkspaceKind(ctx: Context): Promise<WorkspaceKind> {
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
