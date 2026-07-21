import { asc, eq } from "drizzle-orm";

import { getOrganizationType, type OrganizationType } from "../org-metadata";
import { member, organization, user } from "../schema/auth";
import type { Transaction } from "../transaction";

export type UserWithMembership = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  organizationType: OrganizationType | null;
  memberRole: string | null;
};

export async function listUsersWithMembership({
  tx,
}: {
  tx: Transaction;
}): Promise<UserWithMembership[]> {
  const rows = await tx
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      organizationMetadata: organization.metadata,
      memberRole: member.role,
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .leftJoin(organization, eq(organization.id, member.organizationId))
    .orderBy(asc(user.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.emailVerified,
    banned: row.banned,
    createdAt: row.createdAt,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    organizationType: getOrganizationType(row.organizationMetadata),
    memberRole: row.memberRole,
  }));
}
