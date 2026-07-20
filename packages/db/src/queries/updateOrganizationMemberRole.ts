import { and, count, eq } from "drizzle-orm";

import { member } from "../schema/auth";
import type { Transaction } from "../transaction";

export type UpdateOrganizationMemberRoleInput = {
  organizationId: string;
  memberId: string;
  role: string;
};

export type UpdateOrganizationMemberRoleResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "cannot_demote_last_owner" | "invalid_role";
    };

const OWNER_ROLE = "organizationOwner";

export async function updateOrganizationMemberRole({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpdateOrganizationMemberRoleInput;
}): Promise<UpdateOrganizationMemberRoleResult> {
  const [target] = await tx
    .select({ id: member.id, role: member.role })
    .from(member)
    .where(
      and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)),
    )
    .limit(1);

  if (!target) {
    return { ok: false, reason: "not_found" };
  }

  if (target.role === OWNER_ROLE && input.role !== OWNER_ROLE) {
    const [ownerCount] = await tx
      .select({ value: count() })
      .from(member)
      .where(
        and(eq(member.organizationId, input.organizationId), eq(member.role, OWNER_ROLE)),
      );

    if (Number(ownerCount?.value ?? 0) <= 1) {
      return { ok: false, reason: "cannot_demote_last_owner" };
    }
  }

  await tx
    .update(member)
    .set({ role: input.role })
    .where(eq(member.id, input.memberId));

  return { ok: true };
}
