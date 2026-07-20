import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { getOrganizationType, parseOrganizationMetadata } from "@deck-pack/db/org-metadata";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import {
  organizationSeats,
  organizationSubscriptions,
  plans,
} from "@deck-pack/db/schema/billing";
import { tx } from "@deck-pack/db/transaction";
import { bootstrapPersonalOrganization } from "@deck-pack/db/queries/bootstrapPersonalOrganization";
import { ensureFreePlan, FREE_PLAN_SLUG } from "@deck-pack/db/queries/ensureFreePlan";

describe("bootstrapPersonalOrganization (integration)", () => {
  const userId = crypto.randomUUID();
  const now = new Date();

  beforeAll(async () => {
    try {
      await db.execute(sql.raw(`SELECT 1 FROM organization_seats LIMIT 1`));
    } catch {
      const migrationsDir = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../../packages/db/src/migrations",
      );
      for (const file of ["0007_organization_seats.sql", "0005_plan_limits.sql"]) {
        const migrationSql = await readFile(path.join(migrationsDir, file), "utf8");
        for (const statement of migrationSql
          .split("--> statement-breakpoint")
          .map((part) => part.trim())
          .filter(Boolean)) {
          await db.execute(sql.raw(statement));
        }
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
      id: userId,
      name: "Solo User",
      email: "solo@bootstrap.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("creates personal org with individual metadata, free plan, subscription, and active seat", async () => {
    const result = await bootstrapPersonalOrganization({
      tx,
      input: {
        userId,
        email: "solo@bootstrap.test.local",
        name: "Solo User",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(true);

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, result.organizationId))
      .limit(1);
    expect(org).toBeDefined();
    expect(getOrganizationType(org!.metadata)).toBe("individual");

    const [membership] = await db
      .select()
      .from(member)
      .where(eq(member.userId, userId))
      .limit(1);
    expect(membership?.role).toBe("organizationOwner");

    const [freePlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, FREE_PLAN_SLUG))
      .limit(1);
    expect(freePlan).toBeDefined();

    const [subscription] = await db
      .select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, result.organizationId))
      .limit(1);
    expect(subscription?.quantity).toBe(1);

    const [seat] = await db
      .select()
      .from(organizationSeats)
      .where(eq(organizationSeats.organizationId, result.organizationId))
      .limit(1);
    expect(seat?.status).toBe("active");
    expect(seat?.userId).toBe(userId);
  });

  it("is idempotent when user already has membership", async () => {
    const first = await bootstrapPersonalOrganization({
      tx,
      input: { userId, email: "solo@bootstrap.test.local" },
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await bootstrapPersonalOrganization({
      tx,
      input: { userId, email: "solo@bootstrap.test.local" },
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.created).toBe(false);
    expect(second.organizationId).toBe(first.organizationId);

    const memberships = await db.select().from(member).where(eq(member.userId, userId));
    expect(memberships).toHaveLength(1);
  });

  it("ensureFreePlan is idempotent", async () => {
    const first = await ensureFreePlan({ tx });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.created).toBe(true);

    const second = await ensureFreePlan({ tx });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.created).toBe(false);
    expect(second.planId).toBe(first.planId);
  });

  it("parseOrganizationMetadata returns individual type", () => {
    const metadata = parseOrganizationMetadata(JSON.stringify({ type: "individual" }));
    expect(metadata?.type).toBe("individual");
  });
});
