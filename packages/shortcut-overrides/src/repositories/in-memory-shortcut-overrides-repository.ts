import type { ShortcutOverrideRow, UpsertShortcutOverrideInput } from "../domain/shortcut-override";
import type { ShortcutOverridesRepository } from "./shortcut-overrides-repository";

type StoredRow = ShortcutOverrideRow & { userId: string };

export class InMemoryShortcutOverridesRepository implements ShortcutOverridesRepository {
  private rows: StoredRow[] = [];

  seed(userId: string, rows: ShortcutOverrideRow[]): void {
    for (const row of rows) {
      this.rows = this.rows.filter(
        (existing) =>
          !(
            existing.userId === userId &&
            existing.shortcutId === row.shortcutId &&
            existing.schemaVersion === row.schemaVersion
          ),
      );
      this.rows.push({ userId, ...row });
    }
  }

  async listAllByUser(userId: string): Promise<ShortcutOverrideRow[]> {
    return this.rows
      .filter((row) => row.userId === userId)
      .map(({ userId: _userId, ...row }) => ({ ...row }));
  }

  async upsert(input: UpsertShortcutOverrideInput): Promise<ShortcutOverrideRow | null> {
    const next: StoredRow = {
      userId: input.userId,
      shortcutId: input.shortcutId,
      hotkey: input.hotkey,
      schemaVersion: input.schemaVersion,
      updatedAt: new Date(),
    };
    this.rows = this.rows.filter(
      (row) =>
        !(
          row.userId === input.userId &&
          row.shortcutId === input.shortcutId &&
          row.schemaVersion === input.schemaVersion
        ),
    );
    this.rows.push(next);
    const { userId: _userId, ...result } = next;
    return { ...result };
  }

  async deleteOne(input: {
    userId: string;
    shortcutId: string;
    schemaVersion: number;
  }): Promise<void> {
    this.rows = this.rows.filter(
      (row) =>
        !(
          row.userId === input.userId &&
          row.shortcutId === input.shortcutId &&
          row.schemaVersion === input.schemaVersion
        ),
    );
  }

  async deleteAll(input: { userId: string; schemaVersion?: number }): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => {
      if (row.userId !== input.userId) return true;
      if (input.schemaVersion !== undefined && row.schemaVersion !== input.schemaVersion) {
        return true;
      }
      return false;
    });
    return before - this.rows.length;
  }
}
