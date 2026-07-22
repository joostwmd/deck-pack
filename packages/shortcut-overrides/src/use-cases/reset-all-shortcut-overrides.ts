import { SHORTCUT_SCHEMA_VERSION } from "@deck-pack/shortcuts";

import type { ShortcutOverridesRepository } from "../repositories/shortcut-overrides-repository";

export class ResetAllShortcutOverrides {
  constructor(private readonly repo: ShortcutOverridesRepository) {}

  async execute(input: { userId: string }) {
    const deletedCount = await this.repo.deleteAll({
      userId: input.userId,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    });
    return { success: true as const, deletedCount };
  }
}
