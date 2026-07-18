import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import { createBrandProfile, duplicateBrandProfile } from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { user } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";

describe("brand profiles (integration)", () => {
  const truncateSql = `TRUNCATE TABLE brand_profile_versions, brand_profiles, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(sql.raw(truncateSql));
  });

  async function seedUser(id = crypto.randomUUID()) {
    const now = new Date();
    await db.insert(user).values({
      id,
      name: "Profile User",
      email: `${id}@integration.test.local`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });
    return id;
  }

  const sampleConfig = {
    typography: {
      roles: {
        title: { allowedFonts: ["Montserrat"], minimumSize: 28, maximumSize: 44 },
        body: { allowedFonts: ["Inter"], minimumSize: 14, maximumSize: 24 },
      },
      fallbackFonts: ["Arial"],
    },
    colors: {
      palette: [{ id: "primary", name: "Primary", hex: "#0057B8", roles: ["text", "fill"] }],
      maximumColorDistance: 12,
      allowTintsAndShades: true,
    },
    rules: {
      "typography.unapproved-font": { enabled: true, severity: "error", fixMode: "confirm" },
    },
  };

  it("creates a profile with version 1 and active version pointer", async () => {
    const userId = await seedUser();
    const { profile, version } = await createBrandProfile({
      tx,
      input: { userId, name: "Acme", configuration: sampleConfig },
    });

    expect(profile.name).toBe("Acme");
    expect(profile.activeVersionId).toBe(version.id);
    expect(version.version).toBe(1);
    expect(version.configuration).toEqual(sampleConfig);
  });

  it("appends immutable versions and updates active pointer", async () => {
    const userId = await seedUser();
    const { profile } = await createBrandProfile({
      tx,
      input: { userId, name: "Acme", configuration: sampleConfig },
    });

    const nextConfig = { ...sampleConfig, colors: { ...sampleConfig.colors, maximumColorDistance: 8 } };
    const version2 = await createBrandProfileVersion({
      tx,
      profileId: profile.id,
      userId,
      configuration: nextConfig,
    });

    expect(version2?.version).toBe(2);

    const loaded = await getBrandProfileWithVersion({ tx, profileId: profile.id, userId });
    expect(loaded?.version?.version).toBe(2);
    expect(loaded?.version?.configuration).toEqual(nextConfig);
  });

  it("lists profiles for a user with active configuration", async () => {
    const userId = await seedUser();
    await createBrandProfile({ tx, input: { userId, name: "A", configuration: sampleConfig } });
    await createBrandProfile({ tx, input: { userId, name: "B", configuration: sampleConfig } });

    const rows = await listBrandProfilesByUser({ tx, userId });
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.configuration)).toBe(true);
  });

  it("enforces a single default profile per user", async () => {
    const userId = await seedUser();
    const first = await createBrandProfile({
      tx,
      input: { userId, name: "First", configuration: sampleConfig, isDefault: true },
    });
    const second = await createBrandProfile({
      tx,
      input: { userId, name: "Second", configuration: sampleConfig },
    });

    await setDefaultBrandProfile({ tx, profileId: second.profile.id, userId });

    const rows = await listBrandProfilesByUser({ tx, userId });
    const defaults = rows.filter((row) => row.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.id).toBe(second.profile.id);
  });

  it("duplicates a profile under a new name", async () => {
    const userId = await seedUser();
    const original = await createBrandProfile({
      tx,
      input: { userId, name: "Original", configuration: sampleConfig },
    });

    const duplicate = await duplicateBrandProfile({
      tx,
      profileId: original.profile.id,
      userId,
      name: "Copy",
    });

    expect(duplicate?.profile.name).toBe("Copy");
    expect(duplicate?.version.configuration).toEqual(sampleConfig);
  });

  it("archives profiles and excludes them from list results", async () => {
    const userId = await seedUser();
    const { profile } = await createBrandProfile({
      tx,
      input: { userId, name: "To Archive", configuration: sampleConfig },
    });

    await archiveBrandProfile({ tx, profileId: profile.id, userId });
    const rows = await listBrandProfilesByUser({ tx, userId });
    expect(rows).toHaveLength(0);
  });

  it("cascades profile deletion when user is deleted", async () => {
    const userId = await seedUser();
    await createBrandProfile({ tx, input: { userId, name: "Cascade", configuration: sampleConfig } });

    await db.delete(user).where(eq(user.id, userId));
    const rows = await listBrandProfilesByUser({ tx, userId });
    expect(rows).toHaveLength(0);
  });
});
