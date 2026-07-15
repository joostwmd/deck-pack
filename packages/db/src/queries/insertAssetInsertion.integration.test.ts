import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../index";
import { insertAssetInsertion } from "../queries/insertAssetInsertion";
import { assetInsertions } from "../schema/asset-insertions";
import { user } from "../schema/auth";
import { tx } from "../transaction";

describe("insertAssetInsertion (integration)", () => {
  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("persists insertion events with JSONB metadata and server timestamps", async () => {
    const userId = crypto.randomUUID();
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

    const row = await insertAssetInsertion({
      tx,
      input: {
        userId,
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {
          variantId: "0",
          BRAND_NAME: "Acme",
        },
      },
    });

    expect(row.userId).toBe(userId);
    expect(row.assetType).toBe("logo");
    expect(row.externalId).toBe("brand-123");
    expect(row.client).toBe("office");
    expect(row.metadata).toEqual({
      variantId: "0",
      BRAND_NAME: "Acme",
    });
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("allows duplicate insertion rows for repeated usage events", async () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: "Repeat User",
      email: "repeat@integration.test.local",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });

    await insertAssetInsertion({
      tx,
      input: {
        userId,
        assetType: "icon",
        externalId: "icon-1",
        client: "web",
      },
    });

    await insertAssetInsertion({
      tx,
      input: {
        userId,
        assetType: "icon",
        externalId: "icon-1",
        client: "web",
      },
    });

    const rows = await db
      .select({ id: assetInsertions.id })
      .from(assetInsertions)
      .where(eq(assetInsertions.userId, userId));

    expect(rows).toHaveLength(2);
  });
});
