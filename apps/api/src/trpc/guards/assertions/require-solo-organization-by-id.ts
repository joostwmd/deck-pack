import { TRPCError } from "@trpc/server";

import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import { isIndividualOrganization } from "@deck-pack/db/org-metadata";

import type { Context } from "../../context";

export async function requireSoloOrganizationById(
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
