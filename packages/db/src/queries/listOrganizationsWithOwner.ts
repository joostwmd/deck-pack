import { and, eq } from "drizzle-orm";

import { getOrganizationType } from "../org-metadata";
import { member, organization, user } from "../schema/auth";
import type { Transaction } from "../transaction";

const OWNER_ROLE = "organizationOwner" as const;

export async function listOrganizationsWithOwner({ tx }: { tx: Transaction }) {
  const rows = await tx
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      metadata: organization.metadata,
      ownerEmail: user.email,
    })
    .from(organization)
    .leftJoin(
      member,
      and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
    )
    .leftJoin(user, eq(member.userId, user.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    ownerEmail: row.ownerEmail,
    type: getOrganizationType(row.metadata),
  }));
}
