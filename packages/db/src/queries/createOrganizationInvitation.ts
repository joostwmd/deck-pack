import { and, eq, sql } from "drizzle-orm";

import { invitation, member, user } from "../schema/auth";
import type { Transaction } from "../transaction";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateOrganizationInvitationInput = {
  organizationId: string;
  email: string;
  role: string;
  inviterId: string;
};

export type CreateOrganizationInvitationResult =
  | {
      ok: true;
      invitationId: string;
      email: string;
      role: string;
      expiresAt: Date;
    }
  | { ok: false; reason: "already_invited" | "already_member" };

export async function createOrganizationInvitation({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateOrganizationInvitationInput;
}): Promise<CreateOrganizationInvitationResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const [existingUser] = await tx
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1);

  if (existingUser) {
    const [existingMember] = await tx
      .select({ id: member.id })
      .from(member)
      .where(
        and(eq(member.userId, existingUser.id), eq(member.organizationId, input.organizationId)),
      )
      .limit(1);

    if (existingMember) {
      return { ok: false, reason: "already_member" };
    }
  }

  const [pendingInvite] = await tx
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, input.organizationId),
        sql`lower(${invitation.email}) = ${normalizedEmail}`,
        eq(invitation.status, "pending"),
      ),
    )
    .limit(1);

  if (pendingInvite) {
    return { ok: false, reason: "already_invited" };
  }

  const invitationId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await tx.insert(invitation).values({
    id: invitationId,
    organizationId: input.organizationId,
    email: normalizedEmail,
    role: input.role,
    status: "pending",
    expiresAt,
    inviterId: input.inviterId,
  });

  return {
    ok: true,
    invitationId,
    email: normalizedEmail,
    role: input.role,
    expiresAt,
  };
}
