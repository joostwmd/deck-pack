import { describe, expect, it, vi } from "vitest";

import {
  CannotDeleteSelfError,
  CannotDeleteTeamOwnerError,
  DeleteOwnAccount,
  DeleteUser,
  ListUsers,
  UserNotFoundError,
} from "@deck-pack/users";
import { InMemoryUsersRepository } from "@deck-pack/users/repositories/in-memory-users-repository";

function createSeededRepo() {
  const repo = new InMemoryUsersRepository();
  repo.seed([
    {
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      role: null,
      emailVerified: true,
      banned: false,
      createdAt: new Date("2024-01-01"),
      organizationId: "org-1",
      organizationName: "Acme",
      organizationSlug: "acme",
      organizationType: "team",
      memberRole: "organizationOwner",
    },
    {
      id: "user-2",
      name: "Bob",
      email: "bob@example.com",
      role: null,
      emailVerified: false,
      banned: false,
      createdAt: new Date("2024-02-01"),
      organizationId: null,
      organizationName: null,
      organizationSlug: null,
      organizationType: null,
      memberRole: null,
    },
  ]);
  return repo;
}

describe("ListUsers", () => {
  it("lists seeded users ordered by createdAt", async () => {
    const repo = createSeededRepo();
    const rows = await new ListUsers(repo).execute();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.email).toBe("alice@example.com");
    expect(rows[1]?.email).toBe("bob@example.com");
  });
});

describe("DeleteUser", () => {
  it("deletes an existing user", async () => {
    const repo = createSeededRepo();
    const result = await new DeleteUser(repo).execute({
      userId: "user-2",
      actorUserId: "user-1",
    });
    expect(result.userId).toBe("user-2");
    expect(await repo.list()).toHaveLength(1);
  });

  it("throws CannotDeleteSelfError when deleting self", async () => {
    const repo = createSeededRepo();
    await expect(
      new DeleteUser(repo).execute({
        userId: "user-1",
        actorUserId: "user-1",
      }),
    ).rejects.toBeInstanceOf(CannotDeleteSelfError);
  });

  it("throws UserNotFoundError for missing user", async () => {
    const repo = createSeededRepo();
    await expect(
      new DeleteUser(repo).execute({
        userId: "missing",
        actorUserId: "user-1",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe("DeleteOwnAccount", () => {
  it("deletes solo-owned orgs then the user", async () => {
    const repo = new InMemoryUsersRepository();
    repo.seed([
      {
        id: "solo-user",
        name: "Solo",
        email: "solo@example.com",
        role: null,
        emailVerified: true,
        banned: false,
        createdAt: new Date("2024-01-01"),
        organizationId: "solo-org",
        organizationName: "Solo workspace",
        organizationSlug: "solo",
        organizationType: "individual",
        memberRole: "organizationOwner",
      },
    ]);
    const deleteOrganization = vi.fn(async () => ({ organizationId: "solo-org" }));

    const result = await new DeleteOwnAccount(repo, deleteOrganization).execute({
      userId: "solo-user",
    });

    expect(result.userId).toBe("solo-user");
    expect(deleteOrganization).toHaveBeenCalledWith("solo-org");
    expect(await repo.list()).toHaveLength(0);
  });

  it("blocks team organization owners", async () => {
    const repo = createSeededRepo();
    const deleteOrganization = vi.fn();

    await expect(
      new DeleteOwnAccount(repo, deleteOrganization).execute({ userId: "user-1" }),
    ).rejects.toBeInstanceOf(CannotDeleteTeamOwnerError);
    expect(deleteOrganization).not.toHaveBeenCalled();
  });

  it("allows team non-owners to delete without deleting the team org", async () => {
    const repo = new InMemoryUsersRepository();
    repo.seed([
      {
        id: "member-user",
        name: "Member",
        email: "member@example.com",
        role: null,
        emailVerified: true,
        banned: false,
        createdAt: new Date("2024-01-01"),
        organizationId: "team-org",
        organizationName: "Team",
        organizationSlug: "team",
        organizationType: "team",
        memberRole: "organizationMember",
      },
    ]);
    const deleteOrganization = vi.fn();

    const result = await new DeleteOwnAccount(repo, deleteOrganization).execute({
      userId: "member-user",
    });

    expect(result.userId).toBe("member-user");
    expect(deleteOrganization).not.toHaveBeenCalled();
  });
});
