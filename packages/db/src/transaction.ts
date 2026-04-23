import { AsyncLocalStorage } from "node:async_hooks";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "./index";

export type Transaction = PgTransaction<PostgresJsQueryResultHKT, typeof import("./schema"), any>;

const transactionStorage = new AsyncLocalStorage<Transaction>();

/**
 * Transaction singleton - always behaves like a transaction.
 * Auto-creates transactions for single operations when not already in one.
 */
export const tx = new Proxy({} as Transaction, {
  get(_target, prop) {
    const activeTransaction = transactionStorage.getStore();

    if (activeTransaction) {
      // Already in transaction, use it directly
      return activeTransaction[prop as keyof Transaction];
    }

    // Not in transaction - auto-wrap operations
    if (prop === "select" || prop === "insert" || prop === "update" || prop === "delete") {
      return (...args: any[]) => {
        return db.transaction(async (transaction) => {
          return transactionStorage.run(transaction, () => {
            return (transaction as any)[prop](...args);
          });
        });
      };
    }

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
