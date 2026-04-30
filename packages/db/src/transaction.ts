import { AsyncLocalStorage } from "node:async_hooks";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "./index";

export type Transaction = PgTransaction<PostgresJsQueryResultHKT, typeof import("./schema"), any>;

const transactionStorage = new AsyncLocalStorage<Transaction>();

/**
 * Transaction handle: inside `withTransaction`, delegates to the active Drizzle transaction;
 * otherwise delegates to the root `db` so fluent builders like `tx.select().from(...)` work.
 */
export const tx = new Proxy({} as Transaction, {
  get(_target, prop) {
    const activeTransaction = transactionStorage.getStore();

    if (activeTransaction) {
      // Already in transaction, use it directly
      return activeTransaction[prop as keyof Transaction];
    }

    // Outside `withTransaction`, Drizzle query builders must chain synchronously
    // (e.g. `tx.select().from(...)`). Delegate to the root client — do not return
    // a Promise from `select()`/`insert()` or `.from` breaks.

    // For transaction-specific methods, delegate to a real transaction
    if (prop === "transaction") {
      return db.transaction.bind(db);
    }

    // Other properties (like rollback, setTransaction) only work within transactions
    if (prop === "rollback" || prop === "setTransaction") {
      return () => {
        throw new Error(`${String(prop)} can only be called within an active transaction`);
      };
    }

    // Default fallback
    return (db as any)[prop];
  },
});

/**
 * Execute a function within a database transaction.
 * Nested calls will reuse the same transaction.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const activeTransaction = transactionStorage.getStore();

  if (activeTransaction) {
    // Already in transaction, just execute
    return fn();
  }

  // Start new transaction
  return db.transaction(async (transaction) => {
    return transactionStorage.run(transaction, fn);
  });
}
