import { and, eq, gt, sql } from "drizzle-orm";

import { invitation, organization } from "../schema/auth";
import { organizationSeats } from "../schema/billing";
import type { Transaction } from "../transaction";

export type PendingOrgIntent =
  | {
      kind: "invitation";
      invitationId: string;
      organizationId: string;
      organizationName: string;
      role: string | null;
    }
  | {
      kind: "seat";
      seatId: string;
      organizationId: string;
      organizationName: string;
    };

/**
 * Returns pending join intent for an email (invitation preferred over seat).
 * Used to skip personal-org bootstrap on signup.
 */
export async function findPendingOrgIntentByEmail({
  tx,
  email,
}: {
  tx: Transaction;
  email: string;
}): Promise<PendingOrgIntent | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const [pendingInvite] = await tx
    .select({
      invitationId: invitation.id,
      organizationId: invitation.organizationId,
      organizationName: organization.name,
      role: invitation.role,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .where(
      and(
        sql`lower(${invitation.email}) = ${normalizedEmail}`,
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, now),
      ),
    )
    .limit(1);

  if (pendingInvite) {
    return {
      kind: "invitation",
      invitationId: pendingInvite.invitationId,
      organizationId: pendingInvite.organizationId,
      organizationName: pendingInvite.organizationName,
      role: pendingInvite.role,
    };
  }

  const [pendingSeat] = await tx
    .select({
      seatId: organizationSeats.id,
      organizationId: organizationSeats.organizationId,
      organizationName: organization.name,
    })
    .from(organizationSeats)
    .innerJoin(organization, eq(organization.id, organizationSeats.organizationId))
    .where(
      and(
        sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
        eq(organizationSeats.status, "pending"),
      ),
    )
    .limit(1);

  if (pendingSeat) {
    return {
      kind: "seat",
      seatId: pendingSeat.seatId,
      organizationId: pendingSeat.organizationId,
      organizationName: pendingSeat.organizationName,
    };
  }

  return null;
}
