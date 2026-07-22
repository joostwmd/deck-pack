import { createDb, UnitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import { DrizzleSeatsRepository } from "@deck-pack/seats/repositories/seats-repository";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { member, organization, session, user } from "@deck-pack/db/schema/auth";
import { plans } from "@deck-pack/db/schema/billing";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcMutation, trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

describe("addin insertions bearer transport", () => {
  const db = createDb();
  const uow = new UnitOfWork(db);
  const billingRepo = new DrizzleBillingRepository(uow);
  const seatsRepo = new DrizzleSeatsRepository(uow);
  const createdUserIds: string[] = [];
  const truncateSql = `TRUNCATE TABLE organization_seats, organization_subscriptions, plan_limits, plans, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

  async function ensureOrganizationSeatsTable() {
    try {
      await db.execute(sql.raw(`SELECT 1 FROM organization_seats LIMIT 1`));
    } catch {
      const { readFile } = await import("node:fs/promises");
      const { fileURLToPath } = await import("node:url");
      const path = await import("node:path");
      const migrationsDir = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../packages/db/src/migrations",
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
  }

  async function createLicensedAddinFixture(emailPrefix: string) {
    const fixture = await createSignedSessionFixture({ emailPrefix });
    const orgId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: adminId,
      name: "Admin",
      email: `admin-${adminId}@test.local`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(organization).values({
      id: orgId,
      name: "Addin Org",
      slug: `addin-org-${orgId.slice(0, 8)}`,
      createdAt: now,
    });

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: fixture.userId,
      role: "organizationAddinUser",
      createdAt: now,
    });

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: `pro-${planId.slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    });

    await billingRepo.createOrganizationSubscription({
      organizationId: orgId,
      planId,
      quantity: 5,
    });

    await seatsRepo.assign({
      organizationId: orgId,
      email: fixture.email,
      assignedBy: adminId,
    });

    await db
      .update(session)
      .set({ activeOrganizationId: orgId })
      .where(eq(session.userId, fixture.userId));

    return fixture;
  }

  beforeAll(async () => {
    await ensureMigrationsApplied();
    await ensureOrganizationSeatsTable();
  });

  beforeEach(async () => {
    await db.execute(sql.raw(truncateSql));
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("rejects unauthenticated insertion tracking", async () => {
    const app = createApp();
    const { status, body } = await trpcMutation(app, "addin.insertions.track", {
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {},
    });

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("rejects invalid insertion payloads", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-invalid" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body } = await trpcMutation(
      app,
      "addin.insertions.track",
      {
        assetType: "logo",
        externalId: "",
        client: "office",
      },
      fixture.bearerToken,
    );

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code).toBe("BAD_REQUEST");
  });

  it("rejects insertion tracking without an active seat", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-no-seat" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body } = await trpcMutation(
      app,
      "addin.insertions.track",
      {
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {},
      },
      fixture.bearerToken,
    );

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code).toBe("BAD_REQUEST");
  });

  it("persists tracked insertions for authenticated users", async () => {
    const fixture = await createLicensedAddinFixture("addin-track");
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcMutation<{ id: string }>(
      app,
      "addin.insertions.track",
      {
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {
          variantId: "0",
          BRAND_NAME: "Acme",
        },
      },
      fixture.bearerToken,
    );

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.id).toBeTruthy();

    const rows = await db
      .select()
      .from(assetInsertions)
      .where(eq(assetInsertions.userId, fixture.userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.assetType).toBe("logo");
    expect(rows[0]?.externalId).toBe("brand-123");
    expect(rows[0]?.metadata).toEqual({
      variantId: "0",
      BRAND_NAME: "Acme",
    });
  });

  it("does not require input for unrelated protected queries after tracking", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-session" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const listResponse = await trpcQuery<{ overrides: unknown[] }>(
      app,
      "shortcuts.list",
      undefined,
      fixture.bearerToken,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.result?.data?.json?.overrides).toEqual([]);
  });
});
