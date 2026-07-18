import { asc, eq } from "drizzle-orm";

import { member, user } from "../schema/auth";
import type { Transaction } from "../transaction";

export type OrganizationMemberRow = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export async function listOrganizationMembers({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<OrganizationMemberRow[]> {
  return tx
    .select({
      memberId: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
    .orderBy(asc(member.createdAt));
}
