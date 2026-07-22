import { createDb } from "@deck-pack/db";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import {
  ListShortcutOverrides,
  ResetAllShortcutOverrides,
  SetShortcutOverride,
  ShortcutConflictError,
} from "@deck-pack/shortcut-overrides";
import { DrizzleShortcutOverridesRepository } from "@deck-pack/shortcut-overrides/repositories/shortcut-overrides-repository";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  cleanupSignedSession,
  createSignedSessionFixture,
} from "../test-utils/create-signed-session-fixture";
import { trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

type SignedSessionFixture = Awaited<ReturnType<typeof createSignedSessionFixture>>;

async function createShortcutSessionFixture(emailPrefix: string): Promise<SignedSessionFixture> {
  return createSignedSessionFixture({ emailPrefix });
}

describe("shortcut overrides bearer transport", () => {
  const db = createDb();
  const repo = new DrizzleShortcutOverridesRepository(new UnitOfWork(db));
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
      await cleanupSignedSession(userId);
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

  it("saves and reloads overrides through the use-case layer", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-save");
    createdUserIds.push(fixture.userId);

    const saved = await new SetShortcutOverride(repo).execute({
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    expect(saved.isCustomized).toBe(true);
    expect(saved.hotkey).toBe("Mod+Alt+P");

    const listed = await new ListShortcutOverrides(repo).execute({ userId: fixture.userId });
    expect(listed.overrides).toHaveLength(1);
    expect(listed.overrides[0]?.shortcutId).toBe("photos");
  });

  it("rejects overlapping internal conflicts", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-conflict");
    createdUserIds.push(fixture.userId);

    await new SetShortcutOverride(repo).execute({
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+X",
    });

    await expect(
      new SetShortcutOverride(repo).execute({
        userId: fixture.userId,
        shortcutId: "logos",
        hotkey: "Mod+Alt+X",
      }),
    ).rejects.toMatchObject({
      name: "ShortcutConflictError",
      conflictingShortcutId: "photos",
    } satisfies Partial<ShortcutConflictError>);
  });

  it("deletes overrides when saving the default hotkey", async () => {
    const fixture = await createShortcutSessionFixture("shortcuts-reset-default");
    createdUserIds.push(fixture.userId);

    await new SetShortcutOverride(repo).execute({
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const reset = await new SetShortcutOverride(repo).execute({
      userId: fixture.userId,
      shortcutId: "photos",
      hotkey: "Mod+Shift+P",
    });

    expect(reset.isCustomized).toBe(false);

    const listed = await new ListShortcutOverrides(repo).execute({ userId: fixture.userId });
    expect(listed.overrides).toHaveLength(0);
  });

  it("isolates overrides between users", async () => {
    const fixtureA = await createShortcutSessionFixture("shortcuts-user-a");
    const fixtureB = await createShortcutSessionFixture("shortcuts-user-b");
    createdUserIds.push(fixtureA.userId, fixtureB.userId);

    await new SetShortcutOverride(repo).execute({
      userId: fixtureA.userId,
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const listedA = await new ListShortcutOverrides(repo).execute({ userId: fixtureA.userId });
    const listedB = await new ListShortcutOverrides(repo).execute({ userId: fixtureB.userId });

    expect(listedA.overrides).toHaveLength(1);
    expect(listedB.overrides).toHaveLength(0);

    const deleted = await new ResetAllShortcutOverrides(repo).execute({
      userId: fixtureA.userId,
    });
    expect(deleted.deletedCount).toBe(1);
  });
});
