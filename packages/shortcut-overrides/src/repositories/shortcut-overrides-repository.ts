import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type { ShortcutOverrideRow, UpsertShortcutOverrideInput } from "../domain/shortcut-override";

export type ShortcutOverridesRepository = {
  listAllByUser(userId: string): Promise<ShortcutOverrideRow[]>;
  upsert(input: UpsertShortcutOverrideInput): Promise<ShortcutOverrideRow | null>;
  deleteOne(input: { userId: string; shortcutId: string; schemaVersion: number }): Promise<void>;
  deleteAll(input: { userId: string; schemaVersion?: number }): Promise<number>;
};

export class DrizzleShortcutOverridesRepository implements ShortcutOverridesRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async listAllByUser(userId: string): Promise<ShortcutOverrideRow[]> {
    return listAllShortcutOverridesByUser({ tx: this.tx(), userId });
  }

  async upsert(input: UpsertShortcutOverrideInput): Promise<ShortcutOverrideRow | null> {
    return upsertShortcutOverride({ tx: this.tx(), input });
  }

  async deleteOne(input: {
    userId: string;
    shortcutId: string;
    schemaVersion: number;
  }): Promise<void> {
    await deleteShortcutOverride({
      tx: this.tx(),
      userId: input.userId,
      shortcutId: input.shortcutId,
      schemaVersion: input.schemaVersion,
    });
  }

  async deleteAll(input: { userId: string; schemaVersion?: number }): Promise<number> {
    return deleteAllShortcutOverrides({
      tx: this.tx(),
      userId: input.userId,
      schemaVersion: input.schemaVersion,
    });
  }
}
