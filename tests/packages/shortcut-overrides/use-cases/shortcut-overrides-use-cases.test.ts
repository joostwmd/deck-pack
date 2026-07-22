import { describe, expect, it } from "vitest";

import {
  ListShortcutOverrides,
  ResetAllShortcutOverrides,
  SetShortcutOverride,
  ShortcutConflictError,
} from "@deck-pack/shortcut-overrides";
import { InMemoryShortcutOverridesRepository } from "@deck-pack/shortcut-overrides/repositories/in-memory-shortcut-overrides-repository";

describe("ListShortcutOverrides", () => {
  it("returns empty overrides for a new user", async () => {
    const repo = new InMemoryShortcutOverridesRepository();
    const result = await new ListShortcutOverrides(repo).execute({ userId: "user-1" });
    expect(result.overrides).toEqual([]);
    expect(result.schemaVersion).toBe(2);
  });
});

describe("SetShortcutOverride", () => {
  it("saves a customized hotkey", async () => {
    const repo = new InMemoryShortcutOverridesRepository();
    const saved = await new SetShortcutOverride(repo).execute({
      userId: "user-1",
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    expect(saved.isCustomized).toBe(true);
    expect(saved.hotkey).toBe("Mod+Alt+P");

    const listed = await new ListShortcutOverrides(repo).execute({ userId: "user-1" });
    expect(listed.overrides).toHaveLength(1);
    expect(listed.overrides[0]?.shortcutId).toBe("photos");
  });

  it("throws ShortcutConflictError on overlapping hotkeys", async () => {
    const repo = new InMemoryShortcutOverridesRepository();
    const set = new SetShortcutOverride(repo);

    await set.execute({
      userId: "user-1",
      shortcutId: "photos",
      hotkey: "Mod+Alt+X",
    });

    await expect(
      set.execute({
        userId: "user-1",
        shortcutId: "logos",
        hotkey: "Mod+Alt+X",
      }),
    ).rejects.toMatchObject({
      name: "ShortcutConflictError",
      conflictingShortcutId: "photos",
    });

    await expect(
      set.execute({
        userId: "user-1",
        shortcutId: "logos",
        hotkey: "Mod+Alt+X",
      }),
    ).rejects.toBeInstanceOf(ShortcutConflictError);
  });

  it("deletes override when saving the default hotkey", async () => {
    const repo = new InMemoryShortcutOverridesRepository();
    const set = new SetShortcutOverride(repo);

    await set.execute({
      userId: "user-1",
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const reset = await set.execute({
      userId: "user-1",
      shortcutId: "photos",
      hotkey: "Mod+Shift+P",
    });

    expect(reset.isCustomized).toBe(false);
    const listed = await new ListShortcutOverrides(repo).execute({ userId: "user-1" });
    expect(listed.overrides).toHaveLength(0);
  });
});

describe("ResetAllShortcutOverrides", () => {
  it("deletes all overrides for the user", async () => {
    const repo = new InMemoryShortcutOverridesRepository();
    await new SetShortcutOverride(repo).execute({
      userId: "user-1",
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    const result = await new ResetAllShortcutOverrides(repo).execute({ userId: "user-1" });
    expect(result.deletedCount).toBe(1);

    const listed = await new ListShortcutOverrides(repo).execute({ userId: "user-1" });
    expect(listed.overrides).toHaveLength(0);
  });
});
