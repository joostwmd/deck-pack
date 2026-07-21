import { describe, expect, it } from "vitest";

import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";
import { OrganizationNotFoundError, OrganizationSlugConflictError } from "@deck-pack/organization";
import { DrizzleOrganizationRepository } from "@deck-pack/organization/repositories/organization-repository";

describe("DrizzleOrganizationRepository", () => {
  it("supports create, read, update, and delete against PGlite", async () => {
    const db = await createPgliteTestDb();
    const uow = new UnitOfWork(db);
    const repo = new DrizzleOrganizationRepository(uow);

    const created = await repo.create({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@acme.com",
      type: "team",
    });

    expect(created.isNewUser).toBe(true);

    const found = await repo.findById(created.organizationId);
    expect(found).toMatchObject({
      id: created.organizationId,
      name: "Acme",
      slug: "acme",
      type: "team",
      ownerEmail: "owner@acme.com",
      memberCount: 1,
    });

    const listed = await repo.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.slug).toBe("acme");

    const members = await repo.listMembers(created.organizationId);
    expect(members).toHaveLength(1);
    expect(members[0]?.email).toBe("owner@acme.com");

    const lookup = await repo.findUserByEmail("owner@acme.com");
    expect(lookup).toEqual({
      found: true,
      name: "owner",
      email: "owner@acme.com",
      hasOrg: true,
    });

    const updated = await repo.update({
      organizationId: created.organizationId,
      name: "Acme Inc",
      slug: "acme-inc",
      type: "individual",
    });
    expect(updated).toMatchObject({
      name: "Acme Inc",
      slug: "acme-inc",
      type: "individual",
    });

    await expect(
      repo.create({
        name: "Conflict",
        slug: "acme-inc",
        ownerEmail: "other@acme.com",
      }),
    ).rejects.toBeInstanceOf(OrganizationSlugConflictError);

    await expect(
      repo.update({
        organizationId: "missing",
        name: "X",
        slug: "x",
      }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);

    const deleted = await repo.delete(created.organizationId);
    expect(deleted.organizationId).toBe(created.organizationId);
    expect(await repo.findById(created.organizationId)).toBeNull();
  }, 30_000);
});
