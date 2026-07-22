import { describe, expect, it } from "vitest";

import {
  AcceptInvitation,
  AcceptPendingSeat,
  AddMember,
  CancelInvitation,
  GetInvitationPreview,
  GetOrganizationProfile,
  GetPendingJoin,
  ListMembers,
  RemoveMember,
  UpdateMemberRole,
} from "@deck-pack/members";
import { InMemoryInvitationPort } from "@deck-pack/members/integrations/in-memory-invitation-port";
import { InMemoryMembersRepository } from "@deck-pack/members/repositories/in-memory-members-repository";
import { InMemoryBillingRepository } from "@deck-pack/billing/repositories/in-memory-billing-repository";
import { InMemoryOrganizationRepository } from "@deck-pack/organization/repositories/in-memory-organization-repository";
import { ConflictError, ForbiddenError, InvalidStateError, NotFoundError } from "@deck-pack/errors";

function createBase() {
  const billing = new InMemoryBillingRepository();
  const organization = new InMemoryOrganizationRepository(billing);
  const repo = new InMemoryMembersRepository(billing, organization);
  const invitationPort = new InMemoryInvitationPort();
  const now = new Date();
  const later = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  repo.seed({
    users: [
      { id: "owner-1", name: "Owner", email: "owner@acme.com" },
      { id: "member-1", name: "Member", email: "member@acme.com" },
      { id: "orphan-1", name: "Orphan", email: "orphan@acme.com" },
      { id: "joiner-1", name: "Joiner", email: "joiner@acme.com" },
    ],
    organizations: [
      {
        organizationId: "org-1",
        name: "Acme",
        type: "team",
        planId: "plan-1",
        quantity: 5,
      },
      {
        organizationId: "org-solo",
        name: "Solo Org",
        type: "individual",
        planId: "plan-1",
        quantity: 1,
      },
      {
        organizationId: "org-invite",
        name: "Invite Target",
        type: "team",
        planId: "plan-1",
        quantity: 5,
      },
    ],
    plans: [{ id: "plan-1", name: "Pro", slug: "pro" }],
    members: [
      {
        memberId: "m-owner",
        organizationId: "org-1",
        userId: "owner-1",
        role: "organizationOwner",
        createdAt: now,
      },
      {
        memberId: "m-member",
        organizationId: "org-1",
        userId: "member-1",
        role: "organizationMember",
        createdAt: new Date(now.getTime() + 1000),
      },
      {
        memberId: "m-solo",
        organizationId: "org-solo",
        userId: "joiner-1",
        role: "organizationOwner",
        createdAt: now,
      },
    ],
    invitations: [
      {
        invitationId: "inv-1",
        organizationId: "org-1",
        email: "pending@acme.com",
        role: "organizationMember",
        status: "pending",
        expiresAt: later,
        createdAt: new Date(now.getTime() + 2000),
      },
      {
        invitationId: "inv-target",
        organizationId: "org-invite",
        email: "joiner@acme.com",
        role: "organizationMember",
        status: "pending",
        expiresAt: later,
        createdAt: now,
      },
    ],
    sessions: [{ sessionId: "sess-1", userId: "joiner-1" }],
  });

  return { repo, invitationPort };
}

describe("ListMembers", () => {
  it("merges members and invitations sorted by createdAt", async () => {
    const { repo } = createBase();
    const entries = await new ListMembers(repo).execute({ organizationId: "org-1" });
    expect(entries.map((e) => e.kind)).toEqual(["member", "member", "invitation"]);
    expect(entries[2]?.email).toBe("pending@acme.com");
  });
});

describe("AddMember", () => {
  it("adds existing user without org as member", async () => {
    const { repo, invitationPort } = createBase();
    const result = await new AddMember(repo, invitationPort).execute({
      organizationId: "org-1",
      email: "orphan@acme.com",
      role: "organizationMember",
      assignSeat: false,
      inviterId: "owner-1",
      headers: new Headers(),
    });
    expect(result).toEqual({ kind: "member", memberId: expect.any(String) });
    expect(invitationPort.calls).toHaveLength(0);
  });

  it("invites unknown email via invitation port", async () => {
    const { repo, invitationPort } = createBase();
    invitationPort.setNextResult({ ok: true, invitationId: "inv-new" });
    const result = await new AddMember(repo, invitationPort).execute({
      organizationId: "org-1",
      email: "new@acme.com",
      role: "organizationMember",
      assignSeat: false,
      inviterId: "owner-1",
      headers: new Headers(),
    });
    expect(result).toEqual({ kind: "invitation", invitationId: "inv-new" });
    expect(invitationPort.calls).toHaveLength(1);
  });

  it("throws ForbiddenError when invitation port returns forbidden", async () => {
    const { repo, invitationPort } = createBase();
    invitationPort.setNextResult({
      ok: false,
      reason: "forbidden",
      message: "Not allowed",
    });
    await expect(
      new AddMember(repo, invitationPort).execute({
        organizationId: "org-1",
        email: "new@acme.com",
        role: "organizationMember",
        assignSeat: false,
        inviterId: "owner-1",
        headers: new Headers(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ConflictError when assigning seat without subscription", async () => {
    const { repo, invitationPort } = createBase();
    repo.seed({
      organizations: [
        {
          organizationId: "org-nosub",
          name: "No Sub",
          type: "team",
        },
      ],
    });
    await expect(
      new AddMember(repo, invitationPort).execute({
        organizationId: "org-nosub",
        email: "orphan@acme.com",
        role: "organizationMember",
        assignSeat: true,
        inviterId: "owner-1",
        headers: new Headers(),
      }),
    ).rejects.toMatchObject({
      message: "Organization has no active subscription",
    });
  });
});

describe("UpdateMemberRole / RemoveMember / CancelInvitation", () => {
  it("updates role", async () => {
    const { repo } = createBase();
    await expect(
      new UpdateMemberRole(repo).execute({
        organizationId: "org-1",
        memberId: "m-member",
        role: "organizationAdmin",
      }),
    ).resolves.toEqual({ memberId: "m-member" });
  });

  it("throws InvalidStateError when demoting last owner", async () => {
    const { repo } = createBase();
    await expect(
      new UpdateMemberRole(repo).execute({
        organizationId: "org-1",
        memberId: "m-owner",
        role: "organizationMember",
      }),
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it("throws NotFoundError for missing member", async () => {
    const { repo } = createBase();
    await expect(
      new RemoveMember(repo).execute({ organizationId: "org-1", memberId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("cancels invitation", async () => {
    const { repo } = createBase();
    await expect(
      new CancelInvitation(repo).execute({
        organizationId: "org-1",
        invitationId: "inv-1",
      }),
    ).resolves.toEqual({ invitationId: "inv-1" });
  });
});

describe("GetOrganizationProfile", () => {
  it("returns type, workspace, and plan", async () => {
    const { repo } = createBase();
    const profile = await new GetOrganizationProfile(repo).execute({
      organizationId: "org-1",
    });
    expect(profile).toEqual({
      type: "team",
      workspace: "team",
      plan: { id: "plan-1", name: "Pro", slug: "pro", quantity: 5 },
    });
  });
});

describe("GetInvitationPreview", () => {
  it("returns preview with membership impact", async () => {
    const { repo } = createBase();
    const preview = await new GetInvitationPreview(repo).execute({
      invitationId: "inv-target",
      userId: "joiner-1",
      userEmail: "joiner@acme.com",
    });
    expect(preview.organizationId).toBe("org-invite");
    expect(preview.currentMembership?.organizationId).toBe("org-solo");
  });

  it("throws ForbiddenError on email mismatch", async () => {
    const { repo } = createBase();
    await expect(
      new GetInvitationPreview(repo).execute({
        invitationId: "inv-target",
        userId: "joiner-1",
        userEmail: "other@acme.com",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("AcceptInvitation", () => {
  it("throws ConflictError when confirmReplace is false and user has org", async () => {
    const { repo } = createBase();
    await expect(
      new AcceptInvitation(repo).execute({
        invitationId: "inv-target",
        userId: "joiner-1",
        sessionId: "sess-1",
        confirmReplace: false,
      }),
    ).rejects.toMatchObject({
      message: "You already belong to an organization. Confirm replacing it to continue.",
    });
    await expect(
      new AcceptInvitation(repo).execute({
        invitationId: "inv-target",
        userId: "joiner-1",
        sessionId: "sess-1",
        confirmReplace: false,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("vacates and accepts when confirmReplace is true", async () => {
    const { repo } = createBase();
    const result = await new AcceptInvitation(repo).execute({
      invitationId: "inv-target",
      userId: "joiner-1",
      sessionId: "sess-1",
      confirmReplace: true,
    });
    expect(result).toEqual({
      organizationId: "org-invite",
      workspace: "team",
      vacatedAction: "deleted",
    });
  });

  it("throws InvalidStateError for expired invitation", async () => {
    const { repo } = createBase();
    repo.seed({
      invitations: [
        {
          invitationId: "inv-expired",
          organizationId: "org-invite",
          email: "orphan@acme.com",
          role: "organizationMember",
          status: "pending",
          expiresAt: new Date(Date.now() - 1000),
        },
      ],
    });
    await expect(
      new AcceptInvitation(repo).execute({
        invitationId: "inv-expired",
        userId: "orphan-1",
        sessionId: "sess-1",
        confirmReplace: false,
      }),
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});

describe("GetPendingJoin", () => {
  it("returns null for seat intent when user has no org", async () => {
    const { repo } = createBase();
    repo.seed({
      seats: [
        {
          seatId: "seat-1",
          organizationId: "org-1",
          email: "orphan@acme.com",
          status: "pending",
        },
      ],
    });
    const result = await new GetPendingJoin(repo).execute({
      userId: "orphan-1",
      userEmail: "orphan@acme.com",
    });
    expect(result).toBeNull();
  });

  it("returns invitation intent", async () => {
    const { repo } = createBase();
    const result = await new GetPendingJoin(repo).execute({
      userId: "joiner-1",
      userEmail: "joiner@acme.com",
    });
    expect(result?.kind).toBe("invitation");
    expect(result?.organizationId).toBe("org-invite");
  });
});

describe("AcceptPendingSeat", () => {
  it("activates seat after vacating current org", async () => {
    const { repo } = createBase();
    repo.seed({
      seats: [
        {
          seatId: "seat-2",
          organizationId: "org-1",
          email: "joiner@acme.com",
          status: "pending",
        },
      ],
    });
    await repo.cancelInvitation({ organizationId: "org-invite", invitationId: "inv-target" });

    const result = await new AcceptPendingSeat(repo).execute({
      userId: "joiner-1",
      userEmail: "joiner@acme.com",
      sessionId: "sess-1",
      confirmReplace: true,
    });
    expect(result.organizationId).toBe("org-1");
    expect(result.vacatedAction).toBe("deleted");
  });

  it("throws NotFoundError when no pending seat", async () => {
    const { repo } = createBase();
    await expect(
      new AcceptPendingSeat(repo).execute({
        userId: "orphan-1",
        userEmail: "orphan@acme.com",
        sessionId: "sess-1",
        confirmReplace: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
