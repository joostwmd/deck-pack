import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../index";
import { deleteAllShortcutOverrides } from "../queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "../queries/deleteShortcutOverride";
import { listAllShortcutOverridesByUser } from "../queries/listShortcutOverridesByUser";
import { upsertShortcutOverride } from "../queries/upsertShortcutOverride";
import { user } from "../schema/auth";
import { ensureMigrationsApplied } from "../test-utils/ensure-migrations";
import { tx } from "../transaction";

describe("shortcut overrides (integration)", () => {
  const truncateSql = `TRUNCATE TABLE shortcut_overrides, brand_profile_versions, brand_profiles, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

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

    await upsertShortcutOverride({
      tx,
      input: {
        userId: userA,
        shortcutId: "photos",
        hotkey: "Mod+Alt+P",
        schemaVersion: 1,
      },
    });

    const rowsA = await listAllShortcutOverridesByUser({ tx, userId: userA });
    const rowsB = await listAllShortcutOverridesByUser({ tx, userId: userB });

    expect(rowsA).toHaveLength(1);
    expect(rowsB).toHaveLength(0);
  });

  it("upserts the same shortcut for the same schema version", async () => {
    const userId = await seedUser();

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Alt+P",
        schemaVersion: 1,
      },
    });

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Shift+P",
        schemaVersion: 1,
      },
    });

    const rows = await listAllShortcutOverridesByUser({ tx, userId });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.hotkey).toBe("Mod+Shift+P");
  });

  it("allows different schema versions for the same shortcut", async () => {
    const userId = await seedUser();

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Alt+P",
        schemaVersion: 1,
      },
    });

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Shift+P",
        schemaVersion: 2,
      },
    });

    const rows = await listAllShortcutOverridesByUser({ tx, userId });
    expect(rows).toHaveLength(2);
  });

  it("deletes a single override idempotently", async () => {
    const userId = await seedUser();

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Alt+P",
        schemaVersion: 1,
      },
    });

    const deleted = await deleteShortcutOverride({
      tx,
      userId,
      shortcutId: "photos",
      schemaVersion: 1,
    });
    expect(deleted?.shortcutId).toBe("photos");

    const missing = await deleteShortcutOverride({
      tx,
      userId,
      shortcutId: "photos",
      schemaVersion: 1,
    });
    expect(missing).toBeNull();
  });

  it("deletes all overrides for a user", async () => {
    const userId = await seedUser();

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "photos",
        hotkey: "Mod+Alt+P",
        schemaVersion: 1,
      },
    });

    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: "insert",
        hotkey: "Mod+Shift+Enter",
        schemaVersion: 1,
      },
    });

    const deletedCount = await deleteAllShortcutOverrides({
      tx,
      userId,
      schemaVersion: 1,
    });

    expect(deletedCount).toBe(2);
    expect(await listAllShortcutOverridesByUser({ tx, userId })).toHaveLength(0);
  });
});
