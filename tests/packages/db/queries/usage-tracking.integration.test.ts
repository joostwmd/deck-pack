import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, unitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import { planLimits } from "@deck-pack/db/schema/billing";
import { DrizzleUsageRepository } from "@deck-pack/usage/repositories/usage-repository";

describe("usage tracking (integration)", () => {
  const usageRepo = new DrizzleUsageRepository(unitOfWork);
  const billingRepo = new DrizzleBillingRepository(unitOfWork);

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

    const freePlan = await billingRepo.ensureFreePlan();
    expect(freePlan.ok).toBe(true);
    if (!freePlan.ok) {
      throw new Error("free plan failed");
    }

    await db
      .update(planLimits)
      .set({ insertsPerMonth: limit })
      .where(eq(planLimits.planId, freePlan.planId));

    const subscription = await billingRepo.createOrganizationSubscription({
      organizationId,
      planId: freePlan.planId,
      quantity: 1,
    });

    expect(subscription.ok).toBe(true);

    return { userId, organizationId };
  }

  it("persists organizationId on insertions", async () => {
    const { userId, organizationId } = await seedOrgWithLimitedPlan(null);

    const result = await usageRepo.insertAssetInsertion({
      organizationId,
      userId,
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
    });

    expect(result?.id).toBeTruthy();
    const [row] = await db
      .select({ organizationId: assetInsertions.organizationId })
      .from(assetInsertions)
      .where(eq(assetInsertions.id, result!.id));
    expect(row?.organizationId).toBe(organizationId);
  });

  it("blocks inserts when quota is exceeded", async () => {
    const { userId, organizationId } = await seedOrgWithLimitedPlan(1);

    await usageRepo.insertAssetInsertion({
      organizationId,
      userId,
      assetType: "icon",
      externalId: "icon-1",
      client: "office",
    });

    const blocked = await usageRepo.assertInsertAllowed({
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
