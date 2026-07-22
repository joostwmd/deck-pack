import { describe, expect, it } from "vitest";

import { organization } from "@deck-pack/db/schema/auth";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { PLAN_LIMIT_ASSET_TYPES } from "@deck-pack/billing";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";

function unlimitedLimits() {
  return PLAN_LIMIT_ASSET_TYPES.map((assetType) => ({
    assetType,
    insertsPerMonth: null as number | null,
  }));
}

describe("DrizzleBillingRepository", () => {
  it("supports plan and subscription CRUD against PGlite", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleBillingRepository(uow);

    const orgId = crypto.randomUUID();
    const now = new Date();

    await db.insert(organization).values({
      id: orgId,
      name: "Billing Org",
      slug: "billing-org",
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    const created = await repo.createPlan({
      name: "Pro",
      slug: "pro",
      limits: unlimitedLimits(),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await repo.listPlans()).toHaveLength(1);
    expect(await repo.getPlan(created.id)).toMatchObject({ slug: "pro", name: "Pro" });

    const slugConflict = await repo.createPlan({
      name: "Other",
      slug: "pro",
      limits: unlimitedLimits(),
    });
    expect(slugConflict).toEqual({ ok: false, reason: "slug_conflict" });

    const updated = await repo.updatePlan({
      planId: created.id,
      name: "Pro Plus",
      slug: "pro-plus",
      limits: unlimitedLimits(),
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.slug).toBe("pro-plus");
    }

    const sub = await repo.createOrganizationSubscription({
      organizationId: orgId,
      planId: created.id,
      quantity: 2,
    });
    expect(sub.ok).toBe(true);
    if (!sub.ok) return;

    const listed = await repo.listOrganizationSubscriptions();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.organizationName).toBe("Billing Org");
    expect(listed[0]?.planSlug).toBe("pro-plus");

    const got = await repo.getOrganizationSubscription(sub.id);
    expect(got?.quantity).toBe(2);

    const already = await repo.createOrganizationSubscription({
      organizationId: orgId,
      planId: created.id,
      quantity: 1,
    });
    expect(already).toEqual({ ok: false, reason: "already_subscribed" });

    const subUpdated = await repo.updateOrganizationSubscription({
      subscriptionId: sub.id,
      quantity: 5,
      status: "canceled",
    });
    expect(subUpdated.ok).toBe(true);
    if (subUpdated.ok) {
      expect(subUpdated.quantity).toBe(5);
      expect(subUpdated.status).toBe("canceled");
    }

    // After cancel, can create a new active subscription
    const next = await repo.createOrganizationSubscription({
      organizationId: orgId,
      planId: created.id,
      quantity: 1,
    });
    expect(next.ok).toBe(true);
  }, 30_000);
});
