import { eq } from "drizzle-orm";

import { member, user } from "../schema/auth";
import type { Transaction } from "../transaction";

import { activateOrganizationSeat, findPendingSeatByEmail } from "./activateOrganizationSeat";
import { addOrganizationMember } from "./addOrganizationMember";

const ADDIN_USER_ROLE = "organizationAddinUser";

export type ActivateSeatForUserResult =
  | { ok: true; organizationId: string; activated: boolean }
  | { ok: false; reason: "user_in_other_org" | "no_pending_seat" };

/**
 * Activates a pending seat for the user on login and ensures org membership.
 * Skips if user already belongs to a different organization.
 */
export async function activateSeatForUser({
  tx,
  userId,
  email,
}: {
  tx: Transaction;
  userId: string;
  email: string;
}): Promise<ActivateSeatForUserResult> {
  const pendingSeat = await findPendingSeatByEmail({ tx, email });
  if (!pendingSeat || pendingSeat.status !== "pending") {
    return { ok: false, reason: "no_pending_seat" };
  }

  const [existingMembership] = await tx
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  if (
    existingMembership &&
    existingMembership.organizationId !== pendingSeat.organizationId
  ) {
    return { ok: false, reason: "user_in_other_org" };
  }

  const activated = await activateOrganizationSeat({
    tx,
    seatId: pendingSeat.seatId,
    userId,
  });

  if (!activated.ok) {
    return { ok: false, reason: "no_pending_seat" };
  }

  if (!existingMembership) {
    await addOrganizationMember({
      tx,
      input: {
        organizationId: pendingSeat.organizationId,
        userId,
        role: ADDIN_USER_ROLE,
      },
    });
  }

  return {
    ok: true,
    organizationId: pendingSeat.organizationId,
    activated: true,
  };
}

export async function getUserEmail({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<string | null> {
  const [row] = await tx
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row?.email ?? null;
}
