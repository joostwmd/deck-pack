import { describe, expect, it } from "vitest";

import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { user } from "@deck-pack/db/schema/auth";
import { UserNotFoundError } from "@deck-pack/users";
import { DrizzleUsersRepository } from "@deck-pack/users/repositories/users-repository";

describe("DrizzleUsersRepository", () => {
  it("supports list and delete against PGlite", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleUsersRepository(uow);

    await db.insert(user).values([
      {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        emailVerified: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "user-2",
        name: "Bob",
        email: "bob@example.com",
        emailVerified: false,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
    ]);

    const listed = await repo.list();
    expect(listed).toHaveLength(2);
    expect(listed[0]?.email).toBe("alice@example.com");
    expect(listed[0]?.banned).toBe(false);
    expect(listed[0]?.organizationId).toBeNull();

    const deleted = await repo.delete("user-2");
    expect(deleted.userId).toBe("user-2");
    expect(await repo.list()).toHaveLength(1);

    await expect(repo.delete("missing")).rejects.toBeInstanceOf(UserNotFoundError);
  }, 30_000);
});
