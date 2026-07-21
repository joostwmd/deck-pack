import { describe, expect, it } from "vitest";

import {
  CreateOrganization,
  DeleteOrganization,
  GetOrganization,
  ListOrganizationMembers,
  ListOrganizations,
  LookupUserByEmail,
  OrganizationNotFoundError,
  OrganizationSlugConflictError,
  UpdateOrganization,
  UserAlreadyInOrganizationError,
} from "@deck-pack/organization";
import { InMemoryOrganizationRepository } from "@deck-pack/organization/repositories/in-memory-organization-repository";

function createSeededRepo() {
  const repo = new InMemoryOrganizationRepository();
  repo.seed({
    users: [
      { id: "user-1", name: "Alice", email: "alice@acme.com" },
      { id: "user-2", name: "Bob", email: "bob@acme.com" },
    ],
    organizations: [
      {
        id: "org-1",
        name: "Acme",
        slug: "acme",
        createdAt: new Date("2024-01-01"),
        type: "team",
        ownerUserId: "user-1",
        members: [
          {
            memberId: "mem-1",
            userId: "user-1",
            role: "organizationOwner",
            createdAt: new Date("2024-01-01"),
          },
        ],
      },
    ],
  });
  return repo;
}

describe("LookupUserByEmail", () => {
  it("returns not found for unknown email", async () => {
    const repo = createSeededRepo();
    const result = await new LookupUserByEmail(repo).execute({ email: "nobody@x.com" });
    expect(result).toEqual({ found: false });
  });

  it("returns found with hasOrg true when user is a member", async () => {
    const repo = createSeededRepo();
    const result = await new LookupUserByEmail(repo).execute({ email: "alice@acme.com" });
    expect(result).toEqual({
      found: true,
      name: "Alice",
      email: "alice@acme.com",
      hasOrg: true,
    });
  });

  it("returns found with hasOrg false when user has no membership", async () => {
    const repo = createSeededRepo();
    const result = await new LookupUserByEmail(repo).execute({ email: "bob@acme.com" });
    expect(result).toEqual({
      found: true,
      name: "Bob",
      email: "bob@acme.com",
      hasOrg: false,
    });
  });
});

describe("ListOrganizations", () => {
  it("lists seeded organizations", async () => {
    const repo = createSeededRepo();
    const rows = await new ListOrganizations(repo).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.slug).toBe("acme");
    expect(rows[0]?.ownerEmail).toBe("alice@acme.com");
  });
});

describe("GetOrganization", () => {
  it("returns detail for existing org", async () => {
    const repo = createSeededRepo();
    const org = await new GetOrganization(repo).execute({ organizationId: "org-1" });
    expect(org.memberCount).toBe(1);
    expect(org.ownerName).toBe("Alice");
  });

  it("throws OrganizationNotFoundError for missing org", async () => {
    const repo = createSeededRepo();
    await expect(
      new GetOrganization(repo).execute({ organizationId: "missing" }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});

describe("ListOrganizationMembers", () => {
  it("lists members for existing org", async () => {
    const repo = createSeededRepo();
    const members = await new ListOrganizationMembers(repo).execute({
      organizationId: "org-1",
    });
    expect(members).toHaveLength(1);
    expect(members[0]?.email).toBe("alice@acme.com");
  });

  it("throws when org does not exist", async () => {
    const repo = createSeededRepo();
    await expect(
      new ListOrganizationMembers(repo).execute({ organizationId: "missing" }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});

describe("CreateOrganization", () => {
  it("creates org with new user", async () => {
    const repo = new InMemoryOrganizationRepository();
    const result = await new CreateOrganization(repo).execute({
      name: "Beta",
      slug: "beta",
      ownerEmail: "owner@beta.com",
    });
    expect(result.isNewUser).toBe(true);
    expect(result.organizationId).toBeTruthy();

    const org = await repo.findById(result.organizationId);
    expect(org?.type).toBe("team");
  });

  it("throws on slug conflict", async () => {
    const repo = createSeededRepo();
    await expect(
      new CreateOrganization(repo).execute({
        name: "Acme 2",
        slug: "acme",
        ownerEmail: "new@acme.com",
      }),
    ).rejects.toBeInstanceOf(OrganizationSlugConflictError);
  });

  it("throws when existing user already has an org", async () => {
    const repo = createSeededRepo();
    await expect(
      new CreateOrganization(repo).execute({
        name: "Other",
        slug: "other",
        ownerEmail: "alice@acme.com",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyInOrganizationError);
  });
});

describe("UpdateOrganization", () => {
  it("updates name and slug", async () => {
    const repo = createSeededRepo();
    const updated = await new UpdateOrganization(repo).execute({
      organizationId: "org-1",
      name: "Acme Inc",
      slug: "acme-inc",
    });
    expect(updated.name).toBe("Acme Inc");
    expect(updated.slug).toBe("acme-inc");
  });

  it("throws not found for missing org", async () => {
    const repo = createSeededRepo();
    await expect(
      new UpdateOrganization(repo).execute({
        organizationId: "missing",
        name: "X",
        slug: "x",
      }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});

describe("DeleteOrganization", () => {
  it("deletes an existing org", async () => {
    const repo = createSeededRepo();
    const result = await new DeleteOrganization(repo).execute({ organizationId: "org-1" });
    expect(result.organizationId).toBe("org-1");
    expect(await repo.findById("org-1")).toBeNull();
  });

  it("throws not found for missing org", async () => {
    const repo = createSeededRepo();
    await expect(
      new DeleteOrganization(repo).execute({ organizationId: "missing" }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});
