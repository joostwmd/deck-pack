import { and, eq } from "drizzle-orm";

import type { UnitOfWork } from "@deck-pack/db";
import { shortcutOverrides } from "@deck-pack/db/schema/shortcut-overrides";

import type { ShortcutOverrideRow, UpsertShortcutOverrideInput } from "../domain/shortcut-override";

export type ShortcutOverridesRepository = {
  listAllByUser(userId: string): Promise<ShortcutOverrideRow[]>;
  upsert(input: UpsertShortcutOverrideInput): Promise<ShortcutOverrideRow | null>;
  deleteOne(input: { userId: string; shortcutId: string; schemaVersion: number }): Promise<void>;
  deleteAll(input: { userId: string; schemaVersion?: number }): Promise<number>;
};

export class DrizzleShortcutOverridesRepository implements ShortcutOverridesRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async listAllByUser(userId: string): Promise<ShortcutOverrideRow[]> {
    const db = this.uow.getDb();
    const conditions = [eq(shortcutOverrides.userId, userId)];

    return db
      .select({
        shortcutId: shortcutOverrides.shortcutId,
        hotkey: shortcutOverrides.hotkey,
        schemaVersion: shortcutOverrides.schemaVersion,
        updatedAt: shortcutOverrides.updatedAt,
      })
      .from(shortcutOverrides)
      .where(and(...conditions));
  }

  async upsert(input: UpsertShortcutOverrideInput): Promise<ShortcutOverrideRow | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .insert(shortcutOverrides)
      .values({
        userId: input.userId,
        shortcutId: input.shortcutId,
        hotkey: input.hotkey,
        schemaVersion: input.schemaVersion,
      })
      .onConflictDoUpdate({
        target: [
          shortcutOverrides.userId,
          shortcutOverrides.shortcutId,
          shortcutOverrides.schemaVersion,
        ],
        set: {
          hotkey: input.hotkey,
          updatedAt: new Date(),
        },
      })
      .returning({
        shortcutId: shortcutOverrides.shortcutId,
        hotkey: shortcutOverrides.hotkey,
        schemaVersion: shortcutOverrides.schemaVersion,
        updatedAt: shortcutOverrides.updatedAt,
      });

    return row ?? null;
  }

  async deleteOne(input: {
    userId: string;
    shortcutId: string;
    schemaVersion: number;
  }): Promise<void> {
    const db = this.uow.getDb();
    await db
      .delete(shortcutOverrides)
      .where(
        and(
          eq(shortcutOverrides.userId, input.userId),
          eq(shortcutOverrides.shortcutId, input.shortcutId),
          eq(shortcutOverrides.schemaVersion, input.schemaVersion),
        ),
      );
  }

  async deleteAll(input: { userId: string; schemaVersion?: number }): Promise<number> {
    const db = this.uow.getDb();
    const conditions = [eq(shortcutOverrides.userId, input.userId)];

    if (input.schemaVersion !== undefined) {
      conditions.push(eq(shortcutOverrides.schemaVersion, input.schemaVersion));
    }

    const deleted = await db
      .delete(shortcutOverrides)
      .where(and(...conditions))
      .returning({ id: shortcutOverrides.id });

    return deleted.length;
  }
}
