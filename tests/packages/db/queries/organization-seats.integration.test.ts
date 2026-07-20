import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import { organizationSeats, organizationSubscriptions, plans } from "@deck-pack/db/schema/billing";
import { tx } from "@deck-pack/db/transaction";
import { activateOrganizationSeat } from "@deck-pack/db/queries/activateOrganizationSeat";
import { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import { countAssignedSeats } from "@deck-pack/db/queries/countAssignedSeats";
import { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import { removeOrganizationMember } from "@deck-pack/db/queries/removeOrganizationMember";

describe("organization seats (integration)", () => {
  const orgId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const planId = crypto.randomUUID();
  const now = new Date();

  beforeAll(async () => {
    try {
      await db.execute(sql.raw(`SELECT 1 FROM organization_seats LIMIT 1`));
    } catch {
      const migrationsDir = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../../packages/db/src/migrations",
      );
      const migrationSql = await readFile(
        path.join(migrationsDir, "0007_organization_seats.sql"),
        "utf8",
      );
      for (const statement of migrationSql
        .split("--> statement-breakpoint")
        .map((part) => part.trim())
        .filter(Boolean)) {
        await db.execute(sql.raw(statement));
      }
    }
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE organization_seats, organization_subscriptions, plan_limits, plans, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );

    await db.insert(user).values({
      id: adminId,
      name: "Admin",
      email: "admin@seats.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(organization).values({
      id: orgId,
      name: "Seats Org",
      slug: "seats-org",
      createdAt: now,
    });

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: "pro",
      createdAt: now,
      updatedAt: now,
    });

    const sub = await createOrganizationSubscription({
      tx,
      input: { organizationId: orgId, planId, quantity: 2 },
    });
    expect(sub.ok).toBe(true);
  });

  it("assigns pending seat for unknown email and activates on login", async () => {
    const assign = await assignOrganizationSeat({
      tx,
      input: {
        organizationId: orgId,
        email: "new@seats.test.local",
        assignedBy: adminId,
      },
    });
    expect(assign.ok).toBe(true);
    if (!assign.ok) return;

    expect(assign.status).toBe("pending");
    expect(await countAssignedSeats({ tx, organizationId: orgId })).toBe(1);

    const userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "New User",
      email: "new@seats.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    const activated = await activateOrganizationSeat({
      tx,
      seatId: assign.seatId,
      userId,
    });
    expect(activated.ok).toBe(true);
  });

  it("hard-blocks assignment when at capacity", async () => {
    await assignOrganizationSeat({
      tx,
      input: { organizationId: orgId, email: "a@seats.test.local", assignedBy: adminId },
    });
    await assignOrganizationSeat({
      tx,
      input: { organizationId: orgId, email: "b@seats.test.local", assignedBy: adminId },
    });

    const third = await assignOrganizationSeat({
      tx,
      input: { organizationId: orgId, email: "c@seats.test.local", assignedBy: adminId },
    });

    expect(third).toEqual({ ok: false, reason: "at_capacity" });
  });

  it("revokes seat and remove member revokes active seat", async () => {
    const memberUserId = crypto.randomUUID();
    const memberRowId = crypto.randomUUID();
    await db.insert(user).values({
      id: memberUserId,
      name: "Member",
      email: "member@seats.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(member).values({
      id: memberRowId,
      organizationId: orgId,
      userId: memberUserId,
      role: "organizationAddinUser",
      createdAt: now,
    });

    const assign = await assignOrganizationSeat({
      tx,
      input: {
        organizationId: orgId,
        email: "member@seats.test.local",
        assignedBy: adminId,
        userId: memberUserId,
        status: "active",
      },
    });
    expect(assign.ok).toBe(true);
    if (!assign.ok) return;

    const removed = await removeOrganizationMember({
      tx,
      organizationId: orgId,
      memberId: memberRowId,
    });
    expect(removed.ok).toBe(true);

    const [seatRow] = await db
      .select({ status: organizationSeats.status })
      .from(organizationSeats)
      .where(sql`${organizationSeats.id} = ${assign.seatId}`);
    expect(seatRow?.status).toBe("revoked");
  });
});
