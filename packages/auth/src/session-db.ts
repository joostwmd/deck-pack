import { and, eq, gt, inArray, sql } from "drizzle-orm";

import type { UnitOfWork } from "@deck-pack/db";
import { invitation, member, organization } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";

const ADDIN_USER_ROLE = "organizationAddinUser";

/**
 * Session-time DB helpers for Better Auth hooks.
 *
 * Inlined here (rather than importing `@deck-pack/members`/`@deck-pack/seats`) because those
 * packages depend on `@deck-pack/auth` — importing them back would create a cycle. Mirrors the
 * equivalent logic already duplicated in `DrizzleMembersRepository`/`DrizzleSeatsRepository`.
 */

export type ActivateSeatForUserResult =
  | { ok: true; organizationId: string; activated: boolean }
  | { ok: false; reason: "user_in_other_org" | "no_pending_seat" };

async function addOrganizationMember(
  uow: UnitOfWork,
  input: { organizationId: string; userId: string; role: string },
): Promise<void> {
  const db = uow.getDb();
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
    createdAt: new Date(),
  });
}

/**
 * Activates a pending seat for the user on login and ensures org membership.
 * Skips if user already belongs to a different organization.
 */
export async function activateSeatForUser(
  uow: UnitOfWork,
  input: { userId: string; email: string },
): Promise<ActivateSeatForUserResult> {
  const db = uow.getDb();
  const normalizedEmail = input.email.toLowerCase().trim();

  const [pendingSeat] = await db
    .select({
      seatId: organizationSeats.id,
      organizationId: organizationSeats.organizationId,
      status: organizationSeats.status,
    })
    .from(organizationSeats)
    .where(
      and(
        sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
        inArray(organizationSeats.status, ["pending", "active"]),
      ),
    )
    .limit(1);

  if (!pendingSeat || pendingSeat.status !== "pending") {
    return { ok: false, reason: "no_pending_seat" };
  }

  const [existingMembership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, input.userId))
    .limit(1);

  if (existingMembership && existingMembership.organizationId !== pendingSeat.organizationId) {
    return { ok: false, reason: "user_in_other_org" };
  }

  const now = new Date();
  await db
    .update(organizationSeats)
    .set({
      status: "active",
      userId: input.userId,
      activatedAt: now,
      updatedAt: now,
    })
    .where(eq(organizationSeats.id, pendingSeat.seatId));

  if (!existingMembership) {
    await addOrganizationMember(uow, {
      organizationId: pendingSeat.organizationId,
      userId: input.userId,
      role: ADDIN_USER_ROLE,
    });
  }

  return {
    ok: true,
    organizationId: pendingSeat.organizationId,
    activated: true,
  };
}

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
export async function findPendingOrgIntentByEmail(
  uow: UnitOfWork,
  input: { email: string },
): Promise<PendingOrgIntent | null> {
  const db = uow.getDb();
  const normalizedEmail = input.email.toLowerCase().trim();
  const now = new Date();

  const [pendingInvite] = await db
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

  const [pendingSeat] = await db
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
