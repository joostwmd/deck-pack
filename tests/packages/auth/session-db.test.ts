import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { serializeOrganizationMetadata } from "@deck-pack/db/org-metadata";
import { invitation, member, organization, user } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import { activateSeatForUser, findPendingOrgIntentByEmail } from "@deck-pack/auth/session-db";

describe("auth session-db helpers", () => {
  async function seedBaseFixture(db: Awaited<ReturnType<typeof createPgliteTestDb>>) {
    const now = new Date();
    const ownerId = crypto.randomUUID();
    const orgId = crypto.randomUUID();

    await db.insert(user).values({
      id: ownerId,
      name: "Owner",
      email: "owner@session-db.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(organization).values({
      id: orgId,
      name: "Session DB Org",
      slug: "session-db-org",
      metadata: serializeOrganizationMetadata({ type: "team" }),
      createdAt: now,
    });

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: ownerId,
      role: "organizationOwner",
      createdAt: now,
    });

    return { now, ownerId, orgId };
  }

  it("findPendingOrgIntentByEmail prefers invitation over pending seat", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const { now, ownerId, orgId } = await seedBaseFixture(db);
    const invitationId = crypto.randomUUID();

    await db.insert(invitation).values({
      id: invitationId,
      organizationId: orgId,
      email: "invitee@session-db.test.local",
      role: "organizationMember",
      status: "pending",
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      inviterId: ownerId,
    });

    await db.insert(organizationSeats).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      email: "invitee@session-db.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const intent = await findPendingOrgIntentByEmail(uow, {
      email: "Invitee@session-db.test.local",
    });

    expect(intent?.kind).toBe("invitation");
    if (intent?.kind === "invitation") {
      expect(intent.invitationId).toBe(invitationId);
      expect(intent.organizationName).toBe("Session DB Org");
    }
  }, 30_000);

  it("findPendingOrgIntentByEmail returns pending seat when no invitation exists", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const { now, ownerId, orgId } = await seedBaseFixture(db);
    const seatId = crypto.randomUUID();

    await db.insert(organizationSeats).values({
      id: seatId,
      organizationId: orgId,
      email: "invitee@session-db.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const intent = await findPendingOrgIntentByEmail(uow, {
      email: "invitee@session-db.test.local",
    });

    expect(intent).toEqual({
      kind: "seat",
      seatId,
      organizationId: orgId,
      organizationName: "Session DB Org",
    });
  }, 30_000);

  it("findPendingOrgIntentByEmail returns null when nothing pending", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    await seedBaseFixture(db);

    const intent = await findPendingOrgIntentByEmail(uow, {
      email: "nobody@session-db.test.local",
    });

    expect(intent).toBeNull();
  }, 30_000);

  it("activateSeatForUser activates a pending seat and adds membership", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const { now, ownerId, orgId } = await seedBaseFixture(db);
    const newUserId = crypto.randomUUID();

    await db.insert(organizationSeats).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      email: "new@session-db.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(user).values({
      id: newUserId,
      name: "New User",
      email: "new@session-db.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    const result = await activateSeatForUser(uow, {
      userId: newUserId,
      email: "new@session-db.test.local",
    });

    expect(result).toEqual({ ok: true, organizationId: orgId, activated: true });

    const memberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, newUserId));

    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.organizationId).toBe(orgId);
  }, 30_000);

  it("activateSeatForUser returns no_pending_seat when there is nothing to activate", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    await seedBaseFixture(db);

    const result = await activateSeatForUser(uow, {
      userId: crypto.randomUUID(),
      email: "ghost@session-db.test.local",
    });

    expect(result).toEqual({ ok: false, reason: "no_pending_seat" });
  }, 30_000);

  it("activateSeatForUser blocks users already in a different organization", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const { now, ownerId, orgId } = await seedBaseFixture(db);

    const otherOrgId = crypto.randomUUID();
    const busyUserId = crypto.randomUUID();

    await db.insert(organization).values({
      id: otherOrgId,
      name: "Other Org",
      slug: "other-session-db-org",
      metadata: serializeOrganizationMetadata({ type: "team" }),
      createdAt: now,
    });

    await db.insert(user).values({
      id: busyUserId,
      name: "Busy User",
      email: "busy@session-db.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: otherOrgId,
      userId: busyUserId,
      role: "organizationOwner",
      createdAt: now,
    });

    await db.insert(organizationSeats).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      email: "busy@session-db.test.local",
      status: "pending",
      assignedBy: ownerId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const result = await activateSeatForUser(uow, {
      userId: busyUserId,
      email: "busy@session-db.test.local",
    });

    expect(result).toEqual({ ok: false, reason: "user_in_other_org" });
  }, 30_000);
});
