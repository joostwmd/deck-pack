import { eq } from "drizzle-orm";

import {
  getOrganizationType,
  type OrganizationType,
} from "../org-metadata";
import { organization } from "../schema/auth";
import type { Transaction } from "../transaction";

export async function getOrganizationMetadataById({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<{ metadata: string | null; type: OrganizationType | null } | null> {
  const [row] = await tx
    .select({
      metadata: organization.metadata,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!row) return null;

  return {
    metadata: row.metadata,
    type: getOrganizationType(row.metadata),
  };
}
