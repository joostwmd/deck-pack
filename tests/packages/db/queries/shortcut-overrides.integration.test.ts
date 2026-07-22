import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { user } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { DrizzleShortcutOverridesRepository } from "@deck-pack/shortcut-overrides/repositories/shortcut-overrides-repository";

describe("shortcut overrides (integration)", () => {
  const truncateSql = `TRUNCATE TABLE shortcut_overrides, brand_profile_versions, brand_profiles, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(sql.raw(truncateSql));
  });

  function repo() {
    return new DrizzleShortcutOverridesRepository(new UnitOfWork(db));
  }

  async function seedUser(id = crypto.randomUUID()) {
    const now = new Date();
    await db.insert(user).values({
      id,
      name: "Shortcut User",
      email: `${id}@integration.test.local`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });
    return id;
  }

  it("isolates overrides per user", async () => {
    const userA = await seedUser();
    const userB = await seedUser();
    const repository = repo();

    await repository.upsert({
      userId: userA,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
      schemaVersion: 1,
    });

    const rowsA = await repository.listAllByUser(userA);
    const rowsB = await repository.listAllByUser(userB);

    expect(rowsA).toHaveLength(1);
    expect(rowsB).toHaveLength(0);
  });

  it("upserts the same shortcut for the same schema version", async () => {
    const userId = await seedUser();
    const repository = repo();

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
      schemaVersion: 1,
    });

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Shift+P",
      schemaVersion: 1,
    });

    const rows = await repository.listAllByUser(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.hotkey).toBe("Mod+Shift+P");
  });

  it("allows different schema versions for the same shortcut", async () => {
    const userId = await seedUser();
    const repository = repo();

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
      schemaVersion: 1,
    });

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Shift+P",
      schemaVersion: 2,
    });

    const rows = await repository.listAllByUser(userId);
    expect(rows).toHaveLength(2);
  });

  it("deletes a single override idempotently", async () => {
    const userId = await seedUser();
    const repository = repo();

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
      schemaVersion: 1,
    });

    await repository.deleteOne({
      userId,
      shortcutId: "photos",
      schemaVersion: 1,
    });

    expect(await repository.listAllByUser(userId)).toHaveLength(0);

    await repository.deleteOne({
      userId,
      shortcutId: "photos",
      schemaVersion: 1,
    });
    expect(await repository.listAllByUser(userId)).toHaveLength(0);
  });

  it("deletes all overrides for a user", async () => {
    const userId = await seedUser();
    const repository = repo();

    await repository.upsert({
      userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
      schemaVersion: 1,
    });

    await repository.upsert({
      userId,
      shortcutId: "insert",
      hotkey: "Mod+Shift+Enter",
      schemaVersion: 1,
    });

    const deletedCount = await repository.deleteAll({
      userId,
      schemaVersion: 1,
    });

    expect(deletedCount).toBe(2);
    expect(await repository.listAllByUser(userId)).toHaveLength(0);
  });
});
