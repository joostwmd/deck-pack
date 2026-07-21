import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { serializeOrganizationMetadata } from "@deck-pack/db/org-metadata";
import { invitation, member, organization, user } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import { tx } from "@deck-pack/db/transaction";
import { acceptInvitationForUser } from "@deck-pack/db/queries/acceptInvitationForUser";
import { findPendingOrgIntentByEmail } from "@deck-pack/db/queries/findPendingOrgIntentByEmail";
import { getCurrentMembershipSummary } from "@deck-pack/db/queries/getCurrentMembershipSummary";
import { vacateCurrentOrganization } from "@deck-pack/db/queries/vacateCurrentOrganization";

describe("pending org intent + replace-on-join (integration)", () => {
  const now = new Date();
  const ownerId = crypto.randomUUID();
  const inviteeId = crypto.randomUUID();
  const otherMemberId = crypto.randomUUID();
  const teamOrgId = crypto.randomUUID();
  const soloOrgId = crypto.randomUUID();
  const invitationId = crypto.randomUUID();
  const seatId = crypto.randomUUID();

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE organization_seats, organization_subscriptions, plan_limits, plans, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );

    await db.insert(user).values([
      {
        id: ownerId,
        name: "Owner",
        email: "owner@join.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: inviteeId,
        name: "Invitee",
        email: "invitee@join.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: otherMemberId,
        name: "Other",
        email: "other@join.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(organization).values([
      {
        id: teamOrgId,
        name: "Team Org",
        slug: "team-org",
        metadata: serializeOrganizationMetadata({ type: "team" }),
        createdAt: now,
      },
      {
        id: soloOrgId,
        name: "Solo Workspace",
        slug: "solo-workspace",
        metadata: serializeOrganizationMetadata({ type: "individual" }),
        createdAt: now,
      },
    ]);

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: teamOrgId,
      userId: ownerId,
      role: "organizationOwner",
      createdAt: now,
    });
  });

  it("findPendingOrgIntentByEmail prefers invitation over pending seat", async () => {
    await db.insert(invitation).values({
      id: invitationId,
      organizationId: teamOrgId,
      email: "invitee@join.test.local",
      role: "organizationMember",
      status: "pending",
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      inviterId: ownerId,
    });

    await db.insert(organizationSeats).values({
      id: seatId,
      organizationId: teamOrgId,
      email: "invitee@join.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const intent = await findPendingOrgIntentByEmail({
      tx,
      email: "Invitee@join.test.local",
    });

    expect(intent?.kind).toBe("invitation");
    if (intent?.kind === "invitation") {
      expect(intent.invitationId).toBe(invitationId);
      expect(intent.organizationName).toBe("Team Org");
    }
  });

  it("findPendingOrgIntentByEmail returns pending seat when no invitation", async () => {
    await db.insert(organizationSeats).values({
      id: seatId,
      organizationId: teamOrgId,
      email: "invitee@join.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const intent = await findPendingOrgIntentByEmail({
      tx,
      email: "invitee@join.test.local",
    });

    expect(intent).toEqual({
      kind: "seat",
      seatId,
      organizationId: teamOrgId,
      organizationName: "Team Org",
    });
  });

  it("vacateCurrentOrganization deletes sole-member solo org", async () => {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: soloOrgId,
      userId: inviteeId,
      role: "organizationOwner",
      createdAt: now,
    });

    const summary = await getCurrentMembershipSummary({ tx, userId: inviteeId });
    expect(summary?.willDeleteOnVacate).toBe(true);
    expect(summary?.blockedSoleOwner).toBe(false);

    const vacated = await vacateCurrentOrganization({ tx, userId: inviteeId });
    expect(vacated).toEqual({
      ok: true,
      action: "deleted",
      organizationId: soloOrgId,
    });

    const after = await getCurrentMembershipSummary({ tx, userId: inviteeId });
    expect(after).toBeNull();
  });

  it("vacateCurrentOrganization blocks sole owner with other members", async () => {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: teamOrgId,
      userId: otherMemberId,
      role: "organizationMember",
      createdAt: now,
    });

    const summary = await getCurrentMembershipSummary({ tx, userId: ownerId });
    expect(summary?.willDeleteOnVacate).toBe(false);
    expect(summary?.blockedSoleOwner).toBe(true);

    const vacated = await vacateCurrentOrganization({ tx, userId: ownerId });
    expect(vacated).toEqual({
      ok: false,
      reason: "sole_owner_with_other_members",
    });
  });

  it("acceptInvitationForUser after vacate joins the invited org", async () => {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: soloOrgId,
      userId: inviteeId,
      role: "organizationOwner",
      createdAt: now,
    });

    await db.insert(invitation).values({
      id: invitationId,
      organizationId: teamOrgId,
      email: "invitee@join.test.local",
      role: "organizationMember",
      status: "pending",
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      inviterId: ownerId,
    });

    const vacated = await vacateCurrentOrganization({ tx, userId: inviteeId });
    expect(vacated.ok).toBe(true);

    const accepted = await acceptInvitationForUser({
      tx,
      invitationId,
      userId: inviteeId,
    });

    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.organizationId).toBe(teamOrgId);

    const membership = await getCurrentMembershipSummary({ tx, userId: inviteeId });
    expect(membership?.organizationId).toBe(teamOrgId);
    expect(membership?.organizationType).toBe("team");
  });
});
