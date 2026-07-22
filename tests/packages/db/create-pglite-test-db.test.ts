import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { user } from "@deck-pack/db/schema/auth";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";

describe("createPgliteTestDb", () => {
  it("applies migrations and supports UnitOfWork read/write", async () => {
    const db = await createPgliteTestDb();
    const unitOfWork = new UnitOfWork(db);

    await unitOfWork.withTransaction(async () => {
      const executor = unitOfWork.getDb();
      await executor.insert(user).values({
        id: "user_test_1",
        name: "Test User",
        email: "test@example.com",
      });
    });

    const rows = await db.select().from(user).where(eq(user.id, "user_test_1"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("test@example.com");
  });
});
