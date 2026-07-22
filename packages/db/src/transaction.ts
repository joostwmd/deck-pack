import { AsyncLocalStorage } from "node:async_hooks";

import type { ExtractTablesWithRelations } from "drizzle-orm/relations";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export type Schema = typeof schema;
export type Database = NodePgDatabase<Schema>;
export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

export type TransactionOptions = {
  isolationLevel?: "read committed" | "repeatable read" | "serializable";
};

type DbLike = PgDatabase<NodePgQueryResultHKT, Schema>;

export class UnitOfWork {
  private readonly transactionStorage = new AsyncLocalStorage<Transaction>();

  constructor(private readonly db: DbLike) {}

  getActiveTransaction(): Transaction | undefined {
    return this.transactionStorage.getStore();
  }

  getDb(): Transaction | DbLike {
    return this.transactionStorage.getStore() ?? this.db;
  }

  async withTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    const active = this.transactionStorage.getStore();

    if (active) {
      if (options?.isolationLevel) {
        throw new Error("Cannot request an isolation level for a transaction already in progress");
      }
      return fn();
    }

    return this.db.transaction(
      (transaction) => this.transactionStorage.run(transaction, fn),
      options?.isolationLevel ? { isolationLevel: options.isolationLevel } : undefined,
    );
  }
}

let defaultUnitOfWork: UnitOfWork | undefined;

/** Called once from `index.ts` to wire the production UnitOfWork instance. */
export function bindUnitOfWork(unitOfWork: UnitOfWork): void {
  defaultUnitOfWork = unitOfWork;
}

function requireUnitOfWork(): UnitOfWork {
  if (!defaultUnitOfWork) {
    throw new Error("UnitOfWork is not initialized. Import from @deck-pack/db instead.");
  }
  return defaultUnitOfWork;
}

/** @deprecated Prefer `unitOfWork.withTransaction`. Kept for incremental domain migration. */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  return requireUnitOfWork().withTransaction(fn);
}
