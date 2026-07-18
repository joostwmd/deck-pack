import { and, eq } from "drizzle-orm";

import { member, organization, user } from "../schema/auth";
import type { Transaction } from "../transaction";

const OWNER_ROLE = "organizationOwner" as const;

export async function listOrganizationsWithOwner({ tx }: { tx: Transaction }) {
  return tx
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      ownerEmail: user.email,
    })
    .from(organization)
    .leftJoin(
      member,
      and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
    )
    .leftJoin(user, eq(member.userId, user.id));
}
