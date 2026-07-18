import { createDb } from "@deck-pack/db";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import { session, user } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createShortcutService } from "@deck-pack/api/domains/shortcuts/service";
import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

const shortcutService = createShortcutService({
  listAllShortcutOverridesByUser,
  upsertShortcutOverride,
  deleteShortcutOverride,
  deleteAllShortcutOverrides,
});

type SignedSessionFixture = Awaited<ReturnType<typeof createSignedSessionFixture>>;

async function createShortcutSessionFixture(emailPrefix: string): Promise<SignedSessionFixture> {
  return createSignedSessionFixture({ emailPrefix });
}

describe("shortcut overrides bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const truncateSql = `TRUNCATE TABLE shortcut_overrides, brand_profile_versions, brand_profiles, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

  beforeAll(async () => {
    await ensureMigrationsApplied();
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

  it("lists empty overrides for an authenticated user", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-list");
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcQuery<{
      overrides?: unknown[];
      schemaVersion?: number;
    }>(app, "shortcuts.list", undefined, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.schemaVersion).toBe(2);
    expect(body.result?.data?.json?.overrides).toEqual([]);
  });

  it("saves and reloads overrides through the service layer", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-save");
    createdUserIds.push(fixture.userId);

    const saved = await shortcutService.setOverride(tx, {
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    expect(saved.data.isCustomized).toBe(true);
    expect(saved.data.hotkey).toBe("Mod+Alt+P");

    const listed = await shortcutService.list(tx, { userId: fixture.userId });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;

    expect(listed.data.overrides).toHaveLength(1);
    expect(listed.data.overrides[0]?.shortcutId).toBe("photos");
  });

  it("rejects overlapping internal conflicts", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-conflict");
    createdUserIds.push(fixture.userId);

    await shortcutService.setOverride(tx, {
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+X",
    });

    const conflict = await shortcutService.setOverride(tx, {
      userId: fixture.userId,
      shortcutId: "logos",
      hotkey: "Mod+Alt+X",
    });

    expect(conflict.ok).toBe(false);
    if (conflict.ok) return;
    expect(conflict.code).toBe("conflict");
    expect(conflict.details).toMatchObject({ shortcutId: "photos" });
  });

  it("deletes overrides when saving the default hotkey", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-reset-default");
    createdUserIds.push(fixture.userId);

    await shortcutService.setOverride(tx, {
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const reset = await shortcutService.setOverride(tx, {
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Shift+P",
    });

    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.data.isCustomized).toBe(false);

    const listed = await shortcutService.list(tx, { userId: fixture.userId });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.overrides).toHaveLength(0);
  });

  it("isolates overrides between users", async () => {
    const fixtureA = await createShortcutSessionFixture("shortcuts-user-a");
    const fixtureB = await createShortcutSessionFixture("shortcuts-user-b");
    createdUserIds.push(fixtureA.userId, fixtureB.userId);

    await shortcutService.setOverride(tx, {
      userId: fixtureA.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const listedA = await shortcutService.list(tx, { userId: fixtureA.userId });
    const listedB = await shortcutService.list(tx, { userId: fixtureB.userId });

    expect(listedA.ok).toBe(true);
    expect(listedB.ok).toBe(true);
    if (!listedA.ok || !listedB.ok) return;

    expect(listedA.data.overrides).toHaveLength(1);
    expect(listedB.data.overrides).toHaveLength(0);

    const deleted = await shortcutService.resetAll(tx, { userId: fixtureA.userId });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.data.deletedCount).toBe(1);
  });
});
