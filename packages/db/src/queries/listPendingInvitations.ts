import { and, asc, eq } from "drizzle-orm";

import { invitation } from "../schema/auth";
import type { Transaction } from "../transaction";

export type PendingInvitationRow = {
  invitationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
};

export async function listPendingInvitations({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<PendingInvitationRow[]> {
  return tx
    .select({
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .where(
      and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")),
    )
    .orderBy(asc(invitation.createdAt));
}

export async function cancelInvitation({
  tx,
  organizationId,
  invitationId,
}: {
  tx: Transaction;
  organizationId: string;
  invitationId: string;
}): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const [row] = await tx
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        eq(invitation.id, invitationId),
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending"),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  await tx
    .update(invitation)
    .set({ status: "canceled" })
    .where(eq(invitation.id, invitationId));

  return { ok: true };
}
