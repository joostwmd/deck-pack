import { and, count, eq } from "drizzle-orm";

import { member } from "../schema/auth";
import type { Transaction } from "../transaction";

import { deleteOrganization } from "./deleteOrganization";
import { removeOrganizationMember } from "./removeOrganizationMember";

const OWNER_ROLE = "organizationOwner";

export type VacateCurrentOrganizationResult =
  | { ok: true; action: "deleted" | "left"; organizationId: string }
  | { ok: false; reason: "no_membership" | "sole_owner_with_other_members" };

/**
 * Removes the user from their current organization.
 * - Sole member → deletes the organization
 * - Last owner with other members → blocked (must transfer ownership)
 * - Otherwise → leaves (removes membership)
 */
export async function vacateCurrentOrganization({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<VacateCurrentOrganizationResult> {
  const [membership] = await tx
    .select({
      memberId: member.id,
      organizationId: member.organizationId,
      role: member.role,
    })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  if (!membership) {
    return { ok: false, reason: "no_membership" };
  }

  const [memberCountRow] = await tx
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, membership.organizationId));

  const memberCount = Number(memberCountRow?.value ?? 0);

  if (memberCount <= 1) {
    const deleted = await deleteOrganization({
      tx,
      organizationId: membership.organizationId,
    });
    if (!deleted.ok) {
      return { ok: false, reason: "no_membership" };
    }
    return {
      ok: true,
      action: "deleted",
      organizationId: membership.organizationId,
    };
  }

  if (membership.role === OWNER_ROLE) {
    const [ownerCountRow] = await tx
      .select({ value: count() })
      .from(member)
      .where(
        and(eq(member.organizationId, membership.organizationId), eq(member.role, OWNER_ROLE)),
      );

    if (Number(ownerCountRow?.value ?? 0) <= 1) {
      return { ok: false, reason: "sole_owner_with_other_members" };
    }
  }

  const removed = await removeOrganizationMember({
    tx,
    organizationId: membership.organizationId,
    memberId: membership.memberId,
  });

  if (!removed.ok) {
    if (removed.reason === "cannot_remove_last_owner") {
      return { ok: false, reason: "sole_owner_with_other_members" };
    }
    return { ok: false, reason: "no_membership" };
  }

  return {
    ok: true,
    action: "left",
    organizationId: membership.organizationId,
  };
}
