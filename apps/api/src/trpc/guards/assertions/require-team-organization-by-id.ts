import { TRPCError } from "@trpc/server";

import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import { isTeamOrganization } from "@deck-pack/db/org-metadata";

import type { Context } from "../../context";

export async function requireTeamOrganizationById(
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
