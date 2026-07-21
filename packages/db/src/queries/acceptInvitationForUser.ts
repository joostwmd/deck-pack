import { and, eq } from "drizzle-orm";

import { invitation, user } from "../schema/auth";
import type { Transaction } from "../transaction";

import { addOrganizationMember } from "./addOrganizationMember";

const DEFAULT_ROLE = "organizationMember";

export type AcceptInvitationForUserResult =
  | { ok: true; organizationId: string; memberId: string; role: string }
  | {
      ok: false;
      reason:
        | "not_found"
        | "not_pending"
        | "expired"
        | "email_mismatch"
        | "user_not_found"
        | "already_member"
        | "user_in_other_org";
    };

/**
 * Accepts a pending invitation for a user who is not already in another org.
 * Caller must vacate any current membership first when replacing.
 */
export async function acceptInvitationForUser({
  tx,
  invitationId,
  userId,
}: {
  tx: Transaction;
  invitationId: string;
  userId: string;
}): Promise<AcceptInvitationForUserResult> {
  const [userRecord] = await tx
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRecord) {
    return { ok: false, reason: "user_not_found" };
  }

  const [invite] = await tx
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
    })
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (!invite) {
    return { ok: false, reason: "not_found" };
  }

  if (invite.status !== "pending") {
    return { ok: false, reason: "not_pending" };
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (invite.email.toLowerCase() !== userRecord.email.toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }

  const role = invite.role?.trim() || DEFAULT_ROLE;

  const added = await addOrganizationMember({
    tx,
    input: {
      organizationId: invite.organizationId,
      userId,
      role,
    },
  });

  if (!added.ok) {
    return { ok: false, reason: added.reason };
  }

  await tx
    .update(invitation)
    .set({ status: "accepted" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.status, "pending")));

  return {
    ok: true,
    organizationId: invite.organizationId,
    memberId: added.memberId,
    role,
  };
}
