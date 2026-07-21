import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import { assertInsertAllowed } from "@deck-pack/db/queries/usage-entitlements";
import { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import { ensureFreePlan } from "@deck-pack/db/queries/ensureFreePlan";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import { planLimits } from "@deck-pack/db/schema/billing";
import { tx } from "@deck-pack/db/transaction";

describe("usage tracking (integration)", () => {
  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE asset_insertions, organization_subscriptions, plan_limits, plans, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );
  });

  async function seedOrgWithLimitedPlan(limit: number | null) {
    const userId = crypto.randomUUID();
    const organizationId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: "Usage User",
      email: `usage-${userId.slice(0, 8)}@integration.test.local`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });

    await db.insert(organization).values({
      id: organizationId,
      name: "Usage Org",
      slug: `usage-${organizationId.slice(0, 8)}`,
      createdAt: now,
      metadata: JSON.stringify({ type: "individual" }),
      logo: null,
    });

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId,
      role: "organizationOwner",
      createdAt: now,
    });

    const freePlan = await ensureFreePlan({ tx });
    expect(freePlan.ok).toBe(true);
    if (!freePlan.ok) {
      throw new Error("free plan failed");
    }

    await db
      .update(planLimits)
      .set({ insertsPerMonth: limit })
      .where(eq(planLimits.planId, freePlan.planId));

    const subscription = await createOrganizationSubscription({
      tx,
      input: {
        organizationId,
        planId: freePlan.planId,
        quantity: 1,
      },
    });

    expect(subscription.ok).toBe(true);

    return { userId, organizationId };
  }

  it("persists organizationId on insertions", async () => {
    const { userId, organizationId } = await seedOrgWithLimitedPlan(null);

    const row = await insertAssetInsertion({
      tx,
      input: {
        organizationId,
        userId,
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
      },
    });

    expect(row?.organizationId).toBe(organizationId);
  });

  it("blocks inserts when quota is exceeded", async () => {
    const { userId, organizationId } = await seedOrgWithLimitedPlan(1);

    await insertAssetInsertion({
      tx,
      input: {
        organizationId,
        userId,
        assetType: "icon",
        externalId: "icon-1",
        client: "office",
      },
    });

    const blocked = await assertInsertAllowed({
      tx,
      organizationId,
      assetType: "icon",
    });

    expect(blocked).toEqual({ ok: false, reason: "quota_exceeded", assetType: "icon" });

    const rows = await db
      .select({ id: assetInsertions.id })
      .from(assetInsertions)
      .where(eq(assetInsertions.organizationId, organizationId));

    expect(rows).toHaveLength(1);
  });
});
