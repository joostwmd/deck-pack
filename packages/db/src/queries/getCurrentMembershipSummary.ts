import { and, count, eq } from "drizzle-orm";

import { getOrganizationType, type OrganizationType } from "../org-metadata";
import { member, organization } from "../schema/auth";
import type { Transaction } from "../transaction";

const OWNER_ROLE = "organizationOwner";

export type CurrentMembershipSummary = {
  memberId: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
  role: string;
  memberCount: number;
  /** True when joining another org would delete this org (sole member). */
  willDeleteOnVacate: boolean;
  /** True when user cannot vacate without transferring ownership. */
  blockedSoleOwner: boolean;
} | null;

export async function getCurrentMembershipSummary({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<CurrentMembershipSummary> {
  const [membership] = await tx
    .select({
      memberId: member.id,
      organizationId: member.organizationId,
      role: member.role,
      organizationName: organization.name,
      metadata: organization.metadata,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .limit(1);

  if (!membership) return null;

  const [memberCountRow] = await tx
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, membership.organizationId));

  const memberCount = Number(memberCountRow?.value ?? 0);
  const willDeleteOnVacate = memberCount <= 1;

  let blockedSoleOwner = false;
  if (!willDeleteOnVacate && membership.role === OWNER_ROLE) {
    const [owners] = await tx
      .select({ value: count() })
      .from(member)
      .where(
        and(eq(member.organizationId, membership.organizationId), eq(member.role, OWNER_ROLE)),
      );
    blockedSoleOwner = Number(owners?.value ?? 0) <= 1;
  }

  return {
    memberId: membership.memberId,
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    organizationType: getOrganizationType(membership.metadata),
    role: membership.role,
    memberCount,
    willDeleteOnVacate,
    blockedSoleOwner,
  };
}
