import type {
  AcceptInvitationForUserResult,
  ActivateSeatResult,
  AddOrganizationMemberResult,
  AssignSeatResult,
  CancelInvitationResult,
  CurrentMembershipSummary,
  InvitationDetails,
  OrganizationMemberRow,
  OrganizationType,
  PendingInvitationRow,
  PendingOrgIntent,
  RemoveMemberResult,
  UpdateMemberRoleResult,
  UserByEmail,
  VacateResult,
} from "../domain/member";
import type { MembersRepository } from "./members-repository";

const OWNER_ROLE = "organizationOwner";

type SeedUser = {
  id: string;
  name: string;
  email: string;
};

type SeedMember = {
  memberId: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt?: Date;
};

type SeedInvitation = {
  invitationId: string;
  organizationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  createdAt?: Date;
};

type SeedOrganization = {
  organizationId: string;
  name: string;
  type: OrganizationType | null;
  planId?: string;
  quantity?: number;
};

type SeedPlan = {
  id: string;
  name: string;
  slug: string;
};

type SeedSeat = {
  seatId: string;
  organizationId: string;
  email: string;
  status: "pending" | "active" | "revoked";
  userId?: string | null;
};

type SeedSession = {
  sessionId: string;
  userId: string;
  activeOrganizationId?: string | null;
  workspace?: "solo" | "team" | null;
};

export type InMemoryMembersSeed = {
  users?: SeedUser[];
  organizations?: SeedOrganization[];
  members?: SeedMember[];
  invitations?: SeedInvitation[];
  plans?: SeedPlan[];
  seats?: SeedSeat[];
  sessions?: SeedSession[];
};

export class InMemoryMembersRepository implements MembersRepository {
  private users = new Map<string, SeedUser>();
  private organizations = new Map<string, SeedOrganization>();
  private members: SeedMember[] = [];
  private invitations: SeedInvitation[] = [];
  private plans = new Map<string, SeedPlan>();
  private seats: SeedSeat[] = [];
  private sessions: SeedSession[] = [];

  seed(data: InMemoryMembersSeed): void {
    for (const u of data.users ?? []) {
      this.users.set(u.id, u);
    }
    for (const org of data.organizations ?? []) {
      this.organizations.set(org.organizationId, org);
    }
    this.members.push(...(data.members ?? []));
    this.invitations.push(...(data.invitations ?? []));
    for (const plan of data.plans ?? []) {
      this.plans.set(plan.id, plan);
    }
    this.seats.push(...(data.seats ?? []));
    this.sessions.push(...(data.sessions ?? []));
  }

  getSessions(): SeedSession[] {
    return this.sessions;
  }

  async listMembers(organizationId: string): Promise<OrganizationMemberRow[]> {
    return this.members
      .filter((m) => m.organizationId === organizationId)
      .map((m) => {
        const u = this.users.get(m.userId)!;
        return {
          memberId: m.memberId,
          userId: m.userId,
          name: u.name,
          email: u.email,
          role: m.role,
          createdAt: m.createdAt ?? new Date(0),
        };
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async listPendingInvitations(organizationId: string): Promise<PendingInvitationRow[]> {
    return this.invitations
      .filter((i) => i.organizationId === organizationId && i.status === "pending")
      .map((i) => ({
        invitationId: i.invitationId,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt ?? new Date(0),
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findUserByEmail(email: string): Promise<UserByEmail | null> {
    const normalized = email.toLowerCase();
    const found = [...this.users.values()].find((u) => u.email.toLowerCase() === normalized);
    if (!found) return null;
    const hasOrg = this.members.some((m) => m.userId === found.id);
    return { id: found.id, name: found.name, email: found.email, hasOrg };
  }

  async addMember(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<AddOrganizationMemberResult> {
    const existing = this.members.find((m) => m.userId === input.userId);
    if (existing) {
      if (existing.organizationId === input.organizationId) {
        return { ok: false, reason: "already_member" };
      }
      return { ok: false, reason: "user_in_other_org" };
    }
    const memberId = crypto.randomUUID();
    this.members.push({
      memberId,
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      createdAt: new Date(),
    });
    return { ok: true, memberId };
  }

  async updateMemberRole(input: {
    organizationId: string;
    memberId: string;
    role: string;
  }): Promise<UpdateMemberRoleResult> {
    const target = this.members.find(
      (m) => m.memberId === input.memberId && m.organizationId === input.organizationId,
    );
    if (!target) return { ok: false, reason: "not_found" };

    if (target.role === OWNER_ROLE && input.role !== OWNER_ROLE) {
      const owners = this.members.filter(
        (m) => m.organizationId === input.organizationId && m.role === OWNER_ROLE,
      );
      if (owners.length <= 1) {
        return { ok: false, reason: "cannot_demote_last_owner" };
      }
    }

    target.role = input.role;
    return { ok: true };
  }

  async removeMember(input: {
    organizationId: string;
    memberId: string;
  }): Promise<RemoveMemberResult> {
    const idx = this.members.findIndex(
      (m) => m.memberId === input.memberId && m.organizationId === input.organizationId,
    );
    if (idx < 0) return { ok: false, reason: "not_found" };

    const target = this.members[idx]!;
    if (target.role === OWNER_ROLE) {
      const owners = this.members.filter(
        (m) => m.organizationId === input.organizationId && m.role === OWNER_ROLE,
      );
      if (owners.length <= 1) {
        return { ok: false, reason: "cannot_remove_last_owner" };
      }
    }

    this.members.splice(idx, 1);
    return { ok: true };
  }

  async cancelInvitation(input: {
    organizationId: string;
    invitationId: string;
  }): Promise<CancelInvitationResult> {
    const invite = this.invitations.find(
      (i) =>
        i.invitationId === input.invitationId &&
        i.organizationId === input.organizationId &&
        i.status === "pending",
    );
    if (!invite) return { ok: false, reason: "not_found" };
    invite.status = "canceled";
    return { ok: true };
  }

  async assignSeat(input: {
    organizationId: string;
    email: string;
    assignedBy: string;
    userId?: string | null;
    status?: "pending" | "active";
  }): Promise<AssignSeatResult> {
    const org = this.organizations.get(input.organizationId);
    if (!org?.planId || org.quantity == null) {
      return { ok: false, reason: "no_subscription" };
    }

    const used = this.seats.filter(
      (s) =>
        s.organizationId === input.organizationId &&
        (s.status === "pending" || s.status === "active"),
    ).length;
    if (used >= org.quantity) {
      return { ok: false, reason: "at_capacity" };
    }

    const emailTaken = this.seats.some(
      (s) =>
        s.organizationId === input.organizationId &&
        s.email.toLowerCase() === input.email.toLowerCase() &&
        (s.status === "pending" || s.status === "active"),
    );
    if (emailTaken) {
      return { ok: false, reason: "email_already_assigned" };
    }

    if (input.userId) {
      const membership = this.members.find((m) => m.userId === input.userId);
      if (membership && membership.organizationId !== input.organizationId) {
        return { ok: false, reason: "user_in_other_org" };
      }
    }

    const seatId = crypto.randomUUID();
    const status = input.status ?? (input.userId ? "active" : "pending");
    this.seats.push({
      seatId,
      organizationId: input.organizationId,
      email: input.email,
      status,
      userId: input.userId ?? null,
    });

    return {
      ok: true,
      seatId,
      status,
      email: input.email,
      userId: input.userId ?? null,
      assignedAt: new Date(),
      activatedAt: status === "active" ? new Date() : null,
    };
  }

  async getOrganizationMetadata(
    organizationId: string,
  ): Promise<{ metadata: string | null; type: OrganizationType | null } | null> {
    const org = this.organizations.get(organizationId);
    if (!org) return null;
    return {
      metadata: org.type ? JSON.stringify({ type: org.type }) : null,
      type: org.type,
    };
  }

  async getActiveSubscription(
    organizationId: string,
  ): Promise<{ planId: string; quantity: number } | null> {
    const org = this.organizations.get(organizationId);
    if (!org?.planId || org.quantity == null) return null;
    return { planId: org.planId, quantity: org.quantity };
  }

  async getPlan(planId: string): Promise<{ id: string; name: string; slug: string } | null> {
    return this.plans.get(planId) ?? null;
  }

  async getInvitationById(invitationId: string): Promise<InvitationDetails | null> {
    const invite = this.invitations.find((i) => i.invitationId === invitationId);
    if (!invite) return null;
    const org = this.organizations.get(invite.organizationId);
    if (!org) return null;
    return {
      invitationId: invite.invitationId,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      organizationId: invite.organizationId,
      organizationName: org.name,
      organizationType: org.type,
    };
  }

  async getCurrentMembershipSummary(userId: string): Promise<CurrentMembershipSummary | null> {
    const membership = this.members.find((m) => m.userId === userId);
    if (!membership) return null;
    const org = this.organizations.get(membership.organizationId);
    if (!org) return null;

    const memberCount = this.members.filter(
      (m) => m.organizationId === membership.organizationId,
    ).length;
    const willDeleteOnVacate = memberCount <= 1;
    let blockedSoleOwner = false;
    if (!willDeleteOnVacate && membership.role === OWNER_ROLE) {
      const owners = this.members.filter(
        (m) => m.organizationId === membership.organizationId && m.role === OWNER_ROLE,
      );
      blockedSoleOwner = owners.length <= 1;
    }

    return {
      memberId: membership.memberId,
      organizationId: membership.organizationId,
      organizationName: org.name,
      organizationType: org.type,
      role: membership.role,
      memberCount,
      willDeleteOnVacate,
      blockedSoleOwner,
    };
  }

  async vacateCurrentOrganization(userId: string): Promise<VacateResult> {
    const membership = this.members.find((m) => m.userId === userId);
    if (!membership) return { ok: false, reason: "no_membership" };

    const orgMembers = this.members.filter((m) => m.organizationId === membership.organizationId);
    if (orgMembers.length <= 1) {
      this.members = this.members.filter((m) => m.memberId !== membership.memberId);
      this.organizations.delete(membership.organizationId);
      return { ok: true, action: "deleted", organizationId: membership.organizationId };
    }

    if (membership.role === OWNER_ROLE) {
      const owners = orgMembers.filter((m) => m.role === OWNER_ROLE);
      if (owners.length <= 1) {
        return { ok: false, reason: "sole_owner_with_other_members" };
      }
    }

    this.members = this.members.filter((m) => m.memberId !== membership.memberId);
    return { ok: true, action: "left", organizationId: membership.organizationId };
  }

  async acceptInvitationForUser(input: {
    invitationId: string;
    userId: string;
  }): Promise<AcceptInvitationForUserResult> {
    const user = this.users.get(input.userId);
    if (!user) return { ok: false, reason: "user_not_found" };

    const invite = this.invitations.find((i) => i.invitationId === input.invitationId);
    if (!invite) return { ok: false, reason: "not_found" };
    if (invite.status !== "pending") return { ok: false, reason: "not_pending" };
    if (invite.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return { ok: false, reason: "email_mismatch" };
    }

    const existing = this.members.find((m) => m.userId === input.userId);
    if (existing) {
      if (existing.organizationId === invite.organizationId) {
        return { ok: false, reason: "already_member" };
      }
      return { ok: false, reason: "user_in_other_org" };
    }

    const role = invite.role ?? "organizationMember";
    const memberId = crypto.randomUUID();
    this.members.push({
      memberId,
      organizationId: invite.organizationId,
      userId: input.userId,
      role,
      createdAt: new Date(),
    });
    invite.status = "accepted";

    return { ok: true, organizationId: invite.organizationId, memberId, role };
  }

  async findPendingOrgIntentByEmail(email: string): Promise<PendingOrgIntent | null> {
    const normalized = email.toLowerCase().trim();
    const now = Date.now();

    const pendingInvite = this.invitations.find(
      (i) =>
        i.email.toLowerCase() === normalized &&
        i.status === "pending" &&
        i.expiresAt.getTime() > now,
    );
    if (pendingInvite) {
      const org = this.organizations.get(pendingInvite.organizationId)!;
      return {
        kind: "invitation",
        invitationId: pendingInvite.invitationId,
        organizationId: pendingInvite.organizationId,
        organizationName: org.name,
        role: pendingInvite.role,
      };
    }

    const pendingSeat = this.seats.find(
      (s) => s.email.toLowerCase() === normalized && s.status === "pending",
    );
    if (pendingSeat) {
      const org = this.organizations.get(pendingSeat.organizationId)!;
      return {
        kind: "seat",
        seatId: pendingSeat.seatId,
        organizationId: pendingSeat.organizationId,
        organizationName: org.name,
      };
    }

    return null;
  }

  async activateSeatForUser(input: { userId: string; email: string }): Promise<ActivateSeatResult> {
    const pendingSeat = this.seats.find(
      (s) => s.email.toLowerCase() === input.email.toLowerCase() && s.status === "pending",
    );
    if (!pendingSeat) return { ok: false, reason: "no_pending_seat" };

    const existing = this.members.find((m) => m.userId === input.userId);
    if (existing && existing.organizationId !== pendingSeat.organizationId) {
      return { ok: false, reason: "user_in_other_org" };
    }

    pendingSeat.status = "active";
    pendingSeat.userId = input.userId;

    if (!existing) {
      this.members.push({
        memberId: crypto.randomUUID(),
        organizationId: pendingSeat.organizationId,
        userId: input.userId,
        role: "organizationAddinUser",
        createdAt: new Date(),
      });
    }

    return { ok: true, organizationId: pendingSeat.organizationId, activated: true };
  }

  async setSessionActiveOrganization(input: {
    userId: string;
    organizationId: string;
    sessionId?: string;
  }): Promise<{ workspace: "solo" | "team" | null }> {
    const org = this.organizations.get(input.organizationId);
    const workspace = org?.type === "individual" ? "solo" : org?.type === "team" ? "team" : null;

    for (const s of this.sessions) {
      if (s.userId === input.userId || s.sessionId === input.sessionId) {
        s.activeOrganizationId = input.organizationId;
        if (workspace) s.workspace = workspace;
      }
    }

    return { workspace };
  }
}
