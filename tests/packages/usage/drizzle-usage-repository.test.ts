import { describe, expect, it } from "vitest";

import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { organization, user } from "@deck-pack/db/schema/auth";
import { organizationSeats, planLimits, plans } from "@deck-pack/db/schema/billing";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { DrizzleUsageRepository } from "@deck-pack/usage/repositories/usage-repository";

describe("DrizzleUsageRepository", () => {
  it("supports count/series/seat usage and entitlement window against PGlite", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleUsageRepository(uow, new DrizzleBillingRepository(uow));

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const seatId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values([
      {
        id: userId,
        name: "Alice",
        email: "alice@usage.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: adminId,
        name: "Admin",
        email: "admin@usage.test.local",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(organization).values({
      id: orgId,
      name: "Usage Org",
      slug: "usage-org",
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: "usage-pro",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(planLimits).values({
      planId,
      assetType: "logo",
      insertsPerMonth: 10,
    });

    const billingRepo = new DrizzleBillingRepository(uow);
    const sub = await billingRepo.createOrganizationSubscription({
      organizationId: orgId,
      planId,
      quantity: 2,
    });
    expect(sub.ok).toBe(true);
    if (!sub.ok) return;

    await db.insert(organizationSeats).values({
      id: seatId,
      organizationId: orgId,
      email: "alice@usage.test.local",
      userId,
      status: "active",
      assignedBy: adminId,
      assignedAt: now,
      activatedAt: now,
    });

    const midPeriod = new Date(sub.currentPeriodStart!.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(assetInsertions).values([
      {
        organizationId: orgId,
        userId,
        assetType: "logo",
        externalId: "logo-1",
        client: "office",
        createdAt: midPeriod,
      },
      {
        organizationId: orgId,
        userId,
        assetType: "logo",
        externalId: "logo-2",
        client: "office",
        createdAt: midPeriod,
      },
      {
        organizationId: orgId,
        userId,
        assetType: "icon",
        externalId: "icon-1",
        client: "office",
        createdAt: midPeriod,
      },
    ]);

    const counts = await repo.countByAssetType({
      organizationId: orgId,
      periodStart: sub.currentPeriodStart!,
      periodEnd: sub.currentPeriodEnd!,
    });
    expect(counts).toEqual(
      expect.arrayContaining([
        { assetType: "logo", count: 2 },
        { assetType: "icon", count: 1 },
      ]),
    );

    const series = await repo.listSeries({
      organizationId: orgId,
      periodStart: sub.currentPeriodStart!,
      periodEnd: sub.currentPeriodEnd!,
    });
    expect(series.some((point) => point.assetType === "logo" && point.count === 2)).toBe(true);

    const seats = await repo.listSeatUsage({
      organizationId: orgId,
      periodStart: sub.currentPeriodStart!,
      periodEnd: sub.currentPeriodEnd!,
    });
    expect(seats).toHaveLength(1);
    expect(seats[0]).toMatchObject({
      seatId,
      userId,
      totalUsed: 3,
    });

    const window = await repo.getEntitlementWindow(orgId);
    expect(window.start).toEqual(sub.currentPeriodStart);
    expect(window.end).toEqual(sub.currentPeriodEnd);
    expect(window.label).toBe("Billing period");

    const plan = await repo.getPlan(planId);
    expect(
      plan?.limits.some((limit) => limit.assetType === "logo" && limit.insertsPerMonth === 10),
    ).toBe(true);
  }, 30_000);
});
