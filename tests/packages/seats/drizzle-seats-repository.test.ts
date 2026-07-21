import { describe, expect, it } from "vitest";

import { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import { organization, user } from "@deck-pack/db/schema/auth";
import { plans } from "@deck-pack/db/schema/billing";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { NoSubscriptionError, SeatAtCapacityError, SeatNotFoundError } from "@deck-pack/seats";
import { DrizzleSeatsRepository } from "@deck-pack/seats/repositories/seats-repository";

describe("DrizzleSeatsRepository", () => {
  it("supports capacity, list, assign, and revoke against PGlite", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleSeatsRepository(uow);

    const orgId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: adminId,
      name: "Admin",
      email: "admin@seats.test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(organization).values({
      id: orgId,
      name: "Seats Org",
      slug: "seats-org",
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    await db.insert(plans).values({
      id: planId,
      name: "Pro",
      slug: "pro",
      createdAt: now,
      updatedAt: now,
    });

    const sub = await createOrganizationSubscription({
      tx: db as never,
      input: { organizationId: orgId, planId, quantity: 2 },
    });
    expect(sub.ok).toBe(true);

    expect(await repo.capacity(orgId)).toEqual({
      purchased: 2,
      used: 0,
      remaining: 2,
    });

    await expect(
      repo.assign({ organizationId: orgId, email: "a@x.com", assignedBy: adminId }),
    ).resolves.toMatchObject({ seatId: expect.any(String) });

    const listed = await repo.list(orgId);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.email).toBe("a@x.com");
    expect(listed[0]?.status).toBe("pending");

    expect(await repo.capacity(orgId)).toEqual({
      purchased: 2,
      used: 1,
      remaining: 1,
    });

    await repo.assign({ organizationId: orgId, email: "b@x.com", assignedBy: adminId });
    await expect(
      repo.assign({ organizationId: orgId, email: "c@x.com", assignedBy: adminId }),
    ).rejects.toBeInstanceOf(SeatAtCapacityError);

    const seatId = listed[0]!.seatId;
    await repo.revoke({ organizationId: orgId, seatId });
    expect(await repo.list(orgId)).toHaveLength(1);

    await expect(repo.revoke({ organizationId: orgId, seatId: "missing" })).rejects.toBeInstanceOf(
      SeatNotFoundError,
    );

    await expect(
      repo.assign({
        organizationId: crypto.randomUUID(),
        email: "orphan@x.com",
        assignedBy: adminId,
      }),
    ).rejects.toBeInstanceOf(NoSubscriptionError);
  }, 30_000);
});
