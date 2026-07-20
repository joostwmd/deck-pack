import { asc, eq } from "drizzle-orm";

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
  memberRole: string | null;
};

export async function listUsersWithMembership({
  tx,
}: {
  tx: Transaction;
}): Promise<UserWithMembership[]> {
  return tx
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
      memberRole: member.role,
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .leftJoin(organization, eq(organization.id, member.organizationId))
    .orderBy(asc(user.createdAt));
}
