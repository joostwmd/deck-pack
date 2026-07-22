import { TRPCError } from "@trpc/server";

import type { OrganizationRepository } from "@deck-pack/organization";
import { isTeamOrganization } from "@deck-pack/db/org-metadata";

export async function requireTeamOrganizationById(
  organizationRepository: OrganizationRepository,
  organizationId: string,
): Promise<void> {
  const org = await organizationRepository.getMetadataById(organizationId);

  if (!org || !isTeamOrganization(org.metadata)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for team organizations",
    });
  }
}
