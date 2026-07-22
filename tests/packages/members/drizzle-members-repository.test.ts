import { describe, expect, it } from "vitest";

import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import { invitation, member, organization, session, user } from "@deck-pack/db/schema/auth";
import { plans } from "@deck-pack/db/schema/billing";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { DrizzleMembersRepository } from "@deck-pack/members/repositories/members-repository";
import { DrizzleSeatsRepository } from "@deck-pack/seats/repositories/seats-repository";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import { eq } from "drizzle-orm";

describe("DrizzleMembersRepository", () => {
  it("supports list, role update, cancel invitation, invitation lookup, and session update", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleMembersRepository(uow);

    const orgId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const memberUserId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const ownerMemberId = crypto.randomUUID();
    const invitationId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const later = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(user).values([
      {
        id: ownerId,
        name: "Owner",
        email: "owner@members.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: memberUserId,
        name: "Member",
        email: "member@members.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(organization).values({
      id: orgId,
      name: "Members Org",
      slug: "members-org",
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    await db.insert(member).values([
      {
        id: ownerMemberId,
        organizationId: orgId,
        userId: ownerId,
        role: "organizationOwner",
        createdAt: now,
      },
      {
        id: memberId,
        organizationId: orgId,
        userId: memberUserId,
        role: "organizationMember",
        createdAt: new Date(now.getTime() + 1000),
      },
    ]);

    await db.insert(invitation).values({
      id: invitationId,
      organizationId: orgId,
      email: "pending@members.test.local",
      role: "organizationMember",
      status: "pending",
      expiresAt: later,
      inviterId: ownerId,
      createdAt: new Date(now.getTime() + 2000),
    });

    await db.insert(session).values({
      id: sessionId,
      expiresAt: later,
      token: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId: memberUserId,
    });

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: "pro",
      createdAt: now,
      updatedAt: now,
    });

    const billingRepo = new DrizzleBillingRepository(uow);
    const sub = await billingRepo.createOrganizationSubscription({
      organizationId: orgId,
      planId,
      quantity: 3,
    });
    expect(sub.ok).toBe(true);

    const members = await repo.listMembers(orgId);
    expect(members).toHaveLength(2);
    expect(members[0]?.email).toBe("owner@members.test.local");

    const invitations = await repo.listPendingInvitations(orgId);
    expect(invitations).toHaveLength(1);
    expect(invitations[0]?.invitationId).toBe(invitationId);

    const demoteLastOwner = await repo.updateMemberRole({
      organizationId: orgId,
      memberId: ownerMemberId,
      role: "organizationMember",
    });
    expect(demoteLastOwner).toEqual({ ok: false, reason: "cannot_demote_last_owner" });

    const roleUpdate = await repo.updateMemberRole({
      organizationId: orgId,
      memberId,
      role: "organizationAdmin",
    });
    expect(roleUpdate).toEqual({ ok: true });

    const invite = await repo.getInvitationById(invitationId);
    expect(invite?.organizationName).toBe("Members Org");
    expect(invite?.organizationType).toBe("team");

    const canceled = await repo.cancelInvitation({ organizationId: orgId, invitationId });
    expect(canceled).toEqual({ ok: true });
    expect(await repo.listPendingInvitations(orgId)).toHaveLength(0);

    const { workspace } = await repo.setSessionActiveOrganization({
      userId: memberUserId,
      organizationId: orgId,
      sessionId,
    });
    expect(workspace).toBe("team");

    const summary = await repo.getCurrentMembershipSummary(memberUserId);
    expect(summary?.organizationId).toBe(orgId);
    expect(summary?.memberCount).toBe(2);

    const metadata = await repo.getOrganizationMetadata(orgId);
    expect(metadata?.type).toBe("team");

    const subscription = await repo.getActiveSubscription(orgId);
    expect(subscription).toEqual({ planId, quantity: 3 });

    const plan = await repo.getPlan(planId);
    expect(plan?.slug).toBe("pro");
  }, 30_000);

  it("removeMember revokes an active seat and rejects removing the last owner", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleMembersRepository(uow);
    const seatsRepo = new DrizzleSeatsRepository(uow);

    const orgId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const memberUserId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const ownerMemberId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values([
      {
        id: ownerId,
        name: "Owner",
        email: "owner2@members.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: memberUserId,
        name: "Member",
        email: "member2@members.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(organization).values({
      id: orgId,
      name: "Members Org 2",
      slug: "members-org-2",
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    await db.insert(member).values([
      {
        id: ownerMemberId,
        organizationId: orgId,
        userId: ownerId,
        role: "organizationOwner",
        createdAt: now,
      },
      {
        id: memberId,
        organizationId: orgId,
        userId: memberUserId,
        role: "organizationAddinUser",
        createdAt: new Date(now.getTime() + 1000),
      },
    ]);

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: "pro-2",
      createdAt: now,
      updatedAt: now,
    });

    const billingRepo = new DrizzleBillingRepository(uow);
    await billingRepo.createOrganizationSubscription({
      organizationId: orgId,
      planId,
      quantity: 3,
    });

    const cannotRemoveOwner = await repo.removeMember({
      organizationId: orgId,
      memberId: ownerMemberId,
    });
    expect(cannotRemoveOwner).toEqual({ ok: false, reason: "cannot_remove_last_owner" });

    const { seatId } = await seatsRepo.assign({
      organizationId: orgId,
      email: "member2@members.test.local",
      assignedBy: ownerId,
    });
    const [seatBefore] = await db
      .select({ status: organizationSeats.status })
      .from(organizationSeats)
      .where(eq(organizationSeats.id, seatId));
    expect(seatBefore?.status).toBe("active");

    const removed = await repo.removeMember({ organizationId: orgId, memberId });
    expect(removed).toEqual({ ok: true });

    const [seatAfter] = await db
      .select({ status: organizationSeats.status })
      .from(organizationSeats)
      .where(eq(organizationSeats.id, seatId));
    expect(seatAfter?.status).toBe("revoked");

    expect(await repo.removeMember({ organizationId: orgId, memberId: "missing" })).toEqual({
      ok: false,
      reason: "not_found",
    });
  }, 30_000);
});
