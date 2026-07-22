import { SHORTCUT_SCHEMA_VERSION, type ShortcutOverride } from "@deck-pack/shortcuts";

import type { ShortcutOverridesRepository } from "../repositories/shortcut-overrides-repository";

export class ResetShortcutOverride {
  constructor(private readonly repo: ShortcutOverridesRepository) {}

  async execute(input: { userId: string; shortcutId: ShortcutOverride["shortcutId"] }) {
    await this.repo.deleteOne({
      userId: input.userId,
      shortcutId: input.shortcutId,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    });
    return { success: true as const };
  }
}
