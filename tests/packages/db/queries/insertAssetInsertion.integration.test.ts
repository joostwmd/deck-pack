import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, unitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import { DrizzleUsageRepository } from "@deck-pack/usage/repositories/usage-repository";

describe("insertAssetInsertion (integration)", () => {
  const usageRepo = new DrizzleUsageRepository(
    unitOfWork,
    new DrizzleBillingRepository(unitOfWork),
  );

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

  async function seedUserWithOrg() {
    const userId = crypto.randomUUID();
    const organizationId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: "Add-in User",
      email: "addin@integration.test.local",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });

    await db.insert(organization).values({
      id: organizationId,
      name: "Add-in Org",
      slug: "addin-org",
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

    return { userId, organizationId };
  }

  it("persists insertion events with JSONB metadata and server timestamps", async () => {
    const { userId, organizationId } = await seedUserWithOrg();

    const result = await usageRepo.insertAssetInsertion({
      organizationId,
      userId,
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {
        variantId: "0",
        BRAND_NAME: "Acme",
      },
    });

    expect(result?.id).toBeTruthy();

    const [row] = await db.select().from(assetInsertions).where(eq(assetInsertions.id, result!.id));

    expect(row?.organizationId).toBe(organizationId);
    expect(row?.userId).toBe(userId);
    expect(row?.assetType).toBe("logo");
    expect(row?.externalId).toBe("brand-123");
    expect(row?.client).toBe("office");
    expect(row?.metadata).toEqual({
      variantId: "0",
      BRAND_NAME: "Acme",
    });
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it("allows duplicate insertion rows for repeated usage events", async () => {
    const { userId, organizationId } = await seedUserWithOrg();

    await usageRepo.insertAssetInsertion({
      organizationId,
      userId,
      assetType: "icon",
      externalId: "icon-1",
      client: "web",
    });

    await usageRepo.insertAssetInsertion({
      organizationId,
      userId,
      assetType: "icon",
      externalId: "icon-1",
      client: "web",
    });

    const rows = await db
      .select({ id: assetInsertions.id })
      .from(assetInsertions)
      .where(eq(assetInsertions.userId, userId));

    expect(rows).toHaveLength(2);
  });
});
