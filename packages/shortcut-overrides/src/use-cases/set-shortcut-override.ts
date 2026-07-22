import {
  SHORTCUT_DEFINITIONS,
  SHORTCUT_SCHEMA_VERSION,
  canonicalizeHotkey,
  findInternalConflict,
  getShortcutDefinition,
  resolveShortcutRegistry,
  type ShortcutOverride,
} from "@deck-pack/shortcuts";

import { ShortcutConflictError, ShortcutOverrideSaveFailedError } from "../domain/errors";
import type { ShortcutOverridesRepository } from "../repositories/shortcut-overrides-repository";
import { loadCurrentShortcutOverrides } from "./list-shortcut-overrides";

export class SetShortcutOverride {
  constructor(private readonly repo: ShortcutOverridesRepository) {}

  async execute(input: {
    userId: string;
    shortcutId: ShortcutOverride["shortcutId"];
    hotkey: string;
  }) {
    const definition = getShortcutDefinition(input.shortcutId);
    const canonicalHotkey = canonicalizeHotkey(input.hotkey);
    const existingOverrides = await loadCurrentShortcutOverrides(this.repo, input.userId);
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, existingOverrides);

    const conflict = findInternalConflict(input.shortcutId, canonicalHotkey, resolved);
    if (conflict) {
      throw new ShortcutConflictError(conflict);
    }

    if (canonicalHotkey === definition.defaultHotkey) {
      await this.repo.deleteOne({
        userId: input.userId,
        shortcutId: input.shortcutId,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
      });

      return {
        shortcutId: input.shortcutId,
        hotkey: definition.defaultHotkey,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
        isCustomized: false,
      };
    }

    const saved = await this.repo.upsert({
      userId: input.userId,
      shortcutId: input.shortcutId,
      hotkey: canonicalHotkey,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    });

    if (!saved) {
      throw new ShortcutOverrideSaveFailedError();
    }

    return {
      shortcutId: saved.shortcutId as ShortcutOverride["shortcutId"],
      hotkey: saved.hotkey,
      schemaVersion: saved.schemaVersion,
      isCustomized: true,
    };
  }
}
