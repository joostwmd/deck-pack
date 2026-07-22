import { describe, expect, it, vi } from "vitest";

import { UnitOfWork } from "@deck-pack/db/transaction";

function createMockDb() {
  const mockTx = { kind: "transaction" as const };
  let transactionDepth = 0;

  const db = {
    kind: "database" as const,
    transaction: vi.fn(
      async <T>(fn: (tx: typeof mockTx) => Promise<T>, _config?: { isolationLevel?: string }) => {
        transactionDepth += 1;
        try {
          return await fn(mockTx);
        } finally {
          transactionDepth -= 1;
        }
      },
    ),
  };

  return { db, mockTx, getTransactionDepth: () => transactionDepth };
}

describe("UnitOfWork", () => {
  it("getDb() returns the base connection outside a transaction", () => {
    const { db } = createMockDb();
    const uow = new UnitOfWork(db as never);

    expect(uow.getDb()).toBe(db);
  });

  it("getDb() returns the active transaction inside withTransaction", async () => {
    const { db, mockTx } = createMockDb();
    const uow = new UnitOfWork(db as never);

    await uow.withTransaction(async () => {
      expect(uow.getDb()).toBe(mockTx);
    });
  });

  it("nested withTransaction joins the outer transaction", async () => {
    const { db, getTransactionDepth } = createMockDb();
    const uow = new UnitOfWork(db as never);

    await uow.withTransaction(async () => {
      await uow.withTransaction(async () => {
        expect(getTransactionDepth()).toBe(1);
      });
    });

    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("throws when requesting an isolation level inside an active transaction", async () => {
    const { db } = createMockDb();
    const uow = new UnitOfWork(db as never);

    await expect(
      uow.withTransaction(async () => {
        await uow.withTransaction(async () => undefined, {
          isolationLevel: "serializable",
        });
      }),
    ).rejects.toThrow("Cannot request an isolation level for a transaction already in progress");
  });

  it("passes isolation level to the root transaction", async () => {
    const { db } = createMockDb();
    const uow = new UnitOfWork(db as never);

    await uow.withTransaction(async () => undefined, {
      isolationLevel: "repeatable read",
    });

    expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "repeatable read",
    });
  });
});
