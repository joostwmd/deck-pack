import { and, count, eq } from "drizzle-orm";

import { member } from "../schema/auth";
import type { Transaction } from "../transaction";

import { revokeSeatForUser } from "./revokeOrganizationSeat";

export type RemoveOrganizationMemberResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "cannot_remove_last_owner" };

const OWNER_ROLE = "organizationOwner";

export async function removeOrganizationMember({
  tx,
  organizationId,
  memberId,
}: {
  tx: Transaction;
  organizationId: string;
  memberId: string;
}): Promise<RemoveOrganizationMemberResult> {
  const [target] = await tx
    .select({ id: member.id, userId: member.userId, role: member.role })
    .from(member)
    .where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)))
    .limit(1);

  if (!target) {
    return { ok: false, reason: "not_found" };
  }

  if (target.role === OWNER_ROLE) {
    const [ownerCount] = await tx
      .select({ value: count() })
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.role, OWNER_ROLE)));

    if (Number(ownerCount?.value ?? 0) <= 1) {
      return { ok: false, reason: "cannot_remove_last_owner" };
    }
  }

  await revokeSeatForUser({ tx, organizationId, userId: target.userId });
  await tx.delete(member).where(eq(member.id, memberId));

  return { ok: true };
}
