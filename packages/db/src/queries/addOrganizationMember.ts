import { eq } from "drizzle-orm";

import { member } from "../schema/auth";
import type { Transaction } from "../transaction";

export type AddOrganizationMemberInput = {
  organizationId: string;
  userId: string;
  role: string;
};

export type AddOrganizationMemberResult =
  | { ok: true; memberId: string }
  | { ok: false; reason: "already_member" | "user_in_other_org" };

export async function addOrganizationMember({
  tx,
  input,
}: {
  tx: Transaction;
  input: AddOrganizationMemberInput;
}): Promise<AddOrganizationMemberResult> {
  const [existing] = await tx
    .select({ id: member.id, organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, input.userId))
    .limit(1);

  if (existing) {
    if (existing.organizationId === input.organizationId) {
      return { ok: false, reason: "already_member" };
    }
    return { ok: false, reason: "user_in_other_org" };
  }

  const memberId = crypto.randomUUID();
  await tx.insert(member).values({
    id: memberId,
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
    createdAt: new Date(),
  });

  return { ok: true, memberId };
}
