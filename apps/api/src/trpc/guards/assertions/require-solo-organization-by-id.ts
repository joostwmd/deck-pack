import { TRPCError } from "@trpc/server";

import type { OrganizationRepository } from "@deck-pack/organization";
import { isIndividualOrganization } from "@deck-pack/db/org-metadata";

export async function requireSoloOrganizationById(
  organizationRepository: OrganizationRepository,
  organizationId: string,
): Promise<void> {
  const org = await organizationRepository.getMetadataById(organizationId);

  if (!org || !isIndividualOrganization(org.metadata)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for solo workspaces",
    });
  }
}
