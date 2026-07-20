import { and, count, eq } from "drizzle-orm";

import { getOrganizationType, type OrganizationType } from "../org-metadata";
import { member, organization, user } from "../schema/auth";
import type { Transaction } from "../transaction";

const OWNER_ROLE = "organizationOwner" as const;

export type OrganizationWithOwner = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerEmail: string | null;
  ownerName: string | null;
  memberCount: number;
  type: OrganizationType | null;
};

export async function getOrganizationWithOwner({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<OrganizationWithOwner | null> {
  const [row] = await tx
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      metadata: organization.metadata,
      ownerEmail: user.email,
      ownerName: user.name,
    })
    .from(organization)
    .leftJoin(
      member,
      and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
    )
    .leftJoin(user, eq(member.userId, user.id))
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [memberCountRow] = await tx
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    ownerEmail: row.ownerEmail,
    ownerName: row.ownerName,
    memberCount: Number(memberCountRow?.value ?? 0),
    type: getOrganizationType(row.metadata),
  };
}
