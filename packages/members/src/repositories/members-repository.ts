import { and, asc, count, eq, gt, sql } from "drizzle-orm";

import { getOrganizationType } from "@deck-pack/db/org-metadata";
import { invitation, member, organization, session, user } from "@deck-pack/db/schema/auth";
import { organizationSeats, organizationSubscriptions, plans } from "@deck-pack/db/schema/billing";
import type { UnitOfWork } from "@deck-pack/db";

import type {
  AcceptInvitationForUserResult,
  ActivateSeatResult,
  AddOrganizationMemberResult,
  AssignSeatResult,
  CancelInvitationResult,
  CurrentMembershipSummary,
  InvitationDetails,
  OrganizationMemberRow,
  PendingInvitationRow,
  PendingOrgIntent,
  RemoveMemberResult,
  UpdateMemberRoleResult,
  UserByEmail,
  VacateResult,
} from "../domain/member";

const OWNER_ROLE = "organizationOwner";
const DEFAULT_INVITATION_ROLE = "organizationMember";
const ADDIN_USER_ROLE = "organizationAddinUser";

export interface MembersRepository {
  listMembers(organizationId: string): Promise<OrganizationMemberRow[]>;
  listPendingInvitations(organizationId: string): Promise<PendingInvitationRow[]>;
  findUserByEmail(email: string): Promise<UserByEmail | null>;
  addMember(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<AddOrganizationMemberResult>;
  updateMemberRole(input: {
    organizationId: string;
    memberId: string;
    role: string;
  }): Promise<UpdateMemberRoleResult>;
  removeMember(input: { organizationId: string; memberId: string }): Promise<RemoveMemberResult>;
  cancelInvitation(input: {
    organizationId: string;
    invitationId: string;
  }): Promise<CancelInvitationResult>;
  assignSeat(input: {
    organizationId: string;
    email: string;
    assignedBy: string;
    userId?: string | null;
    status?: "pending" | "active";
  }): Promise<AssignSeatResult>;
  getOrganizationMetadata(
    organizationId: string,
  ): Promise<{ metadata: string | null; type: "individual" | "team" | null } | null>;
  getActiveSubscription(
    organizationId: string,
  ): Promise<{ planId: string; quantity: number } | null>;
  getPlan(planId: string): Promise<{ id: string; name: string; slug: string } | null>;
  getInvitationById(invitationId: string): Promise<InvitationDetails | null>;
  getCurrentMembershipSummary(userId: string): Promise<CurrentMembershipSummary | null>;
  vacateCurrentOrganization(userId: string): Promise<VacateResult>;
  acceptInvitationForUser(input: {
    invitationId: string;
    userId: string;
  }): Promise<AcceptInvitationForUserResult>;
  findPendingOrgIntentByEmail(email: string): Promise<PendingOrgIntent | null>;
  activateSeatForUser(input: { userId: string; email: string }): Promise<ActivateSeatResult>;
  setSessionActiveOrganization(input: {
    userId: string;
    organizationId: string;
    sessionId?: string;
  }): Promise<{ workspace: "solo" | "team" | null }>;
}

export class DrizzleMembersRepository implements MembersRepository {
  constructor(private readonly uow: UnitOfWork) {}

  /** Duplicated read of user-by-email (also owned by seats repo). */
  async findUserByEmail(email: string): Promise<UserByEmail | null> {
    const db = this.uow.getDb();
    const normalizedEmail = email.toLowerCase();

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      .limit(1);

    if (!row) {
      return null;
    }

    const memberships = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.userId, row.id))
      .limit(1);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      hasOrg: memberships.length > 0,
    };
  }

  /** Duplicated write of add-member (also owned by seats repo). */
  private async addOrganizationMemberRow(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<AddOrganizationMemberResult> {
    const db = this.uow.getDb();
    const [existing] = await db
      .select({ id: member.id, organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, input.userId))
      .limit(1);

    if (existing) {
      if (existing.organizationId === input.organizationId) {
        return { ok: false, reason: "already_member" };
      }
      return { ok: false, reason: "user_in_other_org" };
    }

    const memberId = crypto.randomUUID();
    await db.insert(member).values({
      id: memberId,
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      createdAt: new Date(),
    });

    return { ok: true, memberId };
  }

  /** Duplicated write of revoke-seat-for-user (also owned by seats repo). */
  private async revokeSeatForUserRow(input: {
    organizationId: string;
    userId: string;
  }): Promise<void> {
    const db = this.uow.getDb();
    const now = new Date();
    await db
      .update(organizationSeats)
      .set({
        status: "revoked",
        revokedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          eq(organizationSeats.userId, input.userId),
          eq(organizationSeats.status, "active"),
        ),
      );
  }

  async listMembers(organizationId: string): Promise<OrganizationMemberRow[]> {
    const db = this.uow.getDb();
    return db
      .select({
        memberId: member.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
        createdAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId))
      .orderBy(asc(member.createdAt));
  }

  async listPendingInvitations(organizationId: string): Promise<PendingInvitationRow[]> {
    const db = this.uow.getDb();
    return db
      .select({
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })
      .from(invitation)
      .where(and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")))
      .orderBy(asc(invitation.createdAt));
  }

  async addMember(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<AddOrganizationMemberResult> {
    return this.addOrganizationMemberRow(input);
  }

  async updateMemberRole(input: {
    organizationId: string;
    memberId: string;
    role: string;
  }): Promise<UpdateMemberRoleResult> {
    const db = this.uow.getDb();
    const [target] = await db
      .select({ id: member.id, role: member.role })
      .from(member)
      .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)))
      .limit(1);

    if (!target) {
      return { ok: false, reason: "not_found" };
    }

    if (target.role === OWNER_ROLE && input.role !== OWNER_ROLE) {
      const [ownerCount] = await db
        .select({ value: count() })
        .from(member)
        .where(and(eq(member.organizationId, input.organizationId), eq(member.role, OWNER_ROLE)));

      if (Number(ownerCount?.value ?? 0) <= 1) {
        return { ok: false, reason: "cannot_demote_last_owner" };
      }
    }

    await db.update(member).set({ role: input.role }).where(eq(member.id, input.memberId));

    return { ok: true };
  }

  async removeMember(input: {
    organizationId: string;
    memberId: string;
  }): Promise<RemoveMemberResult> {
    const db = this.uow.getDb();
    const [target] = await db
      .select({ id: member.id, userId: member.userId, role: member.role })
      .from(member)
      .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)))
      .limit(1);

    if (!target) {
      return { ok: false, reason: "not_found" };
    }

    if (target.role === OWNER_ROLE) {
      const [ownerCount] = await db
        .select({ value: count() })
        .from(member)
        .where(and(eq(member.organizationId, input.organizationId), eq(member.role, OWNER_ROLE)));

      if (Number(ownerCount?.value ?? 0) <= 1) {
        return { ok: false, reason: "cannot_remove_last_owner" };
      }
    }

    await this.revokeSeatForUserRow({
      organizationId: input.organizationId,
      userId: target.userId,
    });
    await db.delete(member).where(eq(member.id, input.memberId));

    return { ok: true };
  }

  async cancelInvitation(input: {
    organizationId: string;
    invitationId: string;
  }): Promise<CancelInvitationResult> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ id: invitation.id })
      .from(invitation)
      .where(
        and(
          eq(invitation.id, input.invitationId),
          eq(invitation.organizationId, input.organizationId),
          eq(invitation.status, "pending"),
        ),
      )
      .limit(1);

    if (!row) {
      return { ok: false, reason: "not_found" };
    }

    await db
      .update(invitation)
      .set({ status: "canceled" })
      .where(eq(invitation.id, input.invitationId));

    return { ok: true };
  }

  async assignSeat(input: {
    organizationId: string;
    email: string;
    assignedBy: string;
    userId?: string | null;
    status?: "pending" | "active";
  }): Promise<AssignSeatResult> {
    const db = this.uow.getDb();
    const normalizedEmail = input.email.toLowerCase().trim();

    const [subscription] = await db
      .select({ quantity: organizationSubscriptions.quantity })
      .from(organizationSubscriptions)
      .where(
        and(
          eq(organizationSubscriptions.organizationId, input.organizationId),
          eq(organizationSubscriptions.status, "active"),
        ),
      )
      .limit(1);

    if (!subscription) {
      return { ok: false, reason: "no_subscription" };
    }

    const [assignedCountRow] = await db
      .select({ value: count() })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          sql`${organizationSeats.status} IN ('pending', 'active')`,
        ),
      );

    if (Number(assignedCountRow?.value ?? 0) >= subscription.quantity) {
      return { ok: false, reason: "at_capacity" };
    }

    const [existingSeat] = await db
      .select({ id: organizationSeats.id })
      .from(organizationSeats)
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
          sql`${organizationSeats.status} IN ('pending', 'active')`,
        ),
      )
      .limit(1);

    if (existingSeat) {
      return { ok: false, reason: "email_already_assigned" };
    }

    if (input.userId) {
      const [otherMembership] = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .where(eq(member.userId, input.userId))
        .limit(1);

      if (otherMembership && otherMembership.organizationId !== input.organizationId) {
        return { ok: false, reason: "user_in_other_org" };
      }
    }

    const status = input.status ?? (input.userId ? "active" : "pending");
    const now = new Date();

    const [row] = await db
      .insert(organizationSeats)
      .values({
        organizationId: input.organizationId,
        email: normalizedEmail,
        userId: input.userId ?? null,
        status,
        assignedBy: input.assignedBy,
        assignedAt: now,
        activatedAt: status === "active" ? now : null,
      })
      .returning({
        seatId: organizationSeats.id,
        status: organizationSeats.status,
        email: organizationSeats.email,
        userId: organizationSeats.userId,
        assignedAt: organizationSeats.assignedAt,
        activatedAt: organizationSeats.activatedAt,
      });

    if (!row) {
      throw new Error("Failed to assign organization seat");
    }

    return { ok: true, ...row };
  }

  async getOrganizationMetadata(
    organizationId: string,
  ): Promise<{ metadata: string | null; type: "individual" | "team" | null } | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!row) return null;

    return {
      metadata: row.metadata,
      type: getOrganizationType(row.metadata),
    };
  }

  async getActiveSubscription(
    organizationId: string,
  ): Promise<{ planId: string; quantity: number } | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({
        planId: organizationSubscriptions.planId,
        quantity: organizationSubscriptions.quantity,
      })
      .from(organizationSubscriptions)
      .where(
        and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async getPlan(planId: string): Promise<{ id: string; name: string; slug: string } | null> {
    const db = this.uow.getDb();
    const [plan] = await db
      .select({ id: plans.id, name: plans.name, slug: plans.slug })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    return plan ?? null;
  }

  async getInvitationById(invitationId: string): Promise<InvitationDetails | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        metadata: organization.metadata,
      })
      .from(invitation)
      .innerJoin(organization, eq(organization.id, invitation.organizationId))
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (!row) return null;

    return {
      invitationId: row.invitationId,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      organizationType: getOrganizationType(row.metadata),
    };
  }

  async getCurrentMembershipSummary(userId: string): Promise<CurrentMembershipSummary | null> {
    const db = this.uow.getDb();
    const [membership] = await db
      .select({
        memberId: member.id,
        organizationId: member.organizationId,
        role: member.role,
        organizationName: organization.name,
        metadata: organization.metadata,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId))
      .limit(1);

    if (!membership) return null;

    const [memberCountRow] = await db
      .select({ value: count() })
      .from(member)
      .where(eq(member.organizationId, membership.organizationId));

    const memberCount = Number(memberCountRow?.value ?? 0);
    const willDeleteOnVacate = memberCount <= 1;

    let blockedSoleOwner = false;
    if (!willDeleteOnVacate && membership.role === OWNER_ROLE) {
      const [owners] = await db
        .select({ value: count() })
        .from(member)
        .where(
          and(eq(member.organizationId, membership.organizationId), eq(member.role, OWNER_ROLE)),
        );
      blockedSoleOwner = Number(owners?.value ?? 0) <= 1;
    }

    return {
      memberId: membership.memberId,
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      organizationType: getOrganizationType(membership.metadata),
      role: membership.role,
      memberCount,
      willDeleteOnVacate,
      blockedSoleOwner,
    };
  }

  /** Duplicated write of hard-delete-organization (also owned by organization repo). */
  private async deleteOrganizationRow(
    organizationId: string,
  ): Promise<{ ok: true; organizationId: string } | { ok: false; reason: "not_found" }> {
    const db = this.uow.getDb();
    const [existing] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }

    await db
      .update(session)
      .set({ activeOrganizationId: null })
      .where(eq(session.activeOrganizationId, organizationId));

    await db.delete(organization).where(eq(organization.id, organizationId));

    return { ok: true, organizationId };
  }

  async vacateCurrentOrganization(userId: string): Promise<VacateResult> {
    const db = this.uow.getDb();
    const [membership] = await db
      .select({
        memberId: member.id,
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, userId))
      .limit(1);

    if (!membership) {
      return { ok: false, reason: "no_membership" };
    }

    const [memberCountRow] = await db
      .select({ value: count() })
      .from(member)
      .where(eq(member.organizationId, membership.organizationId));

    const memberCount = Number(memberCountRow?.value ?? 0);

    if (memberCount <= 1) {
      const deleted = await this.deleteOrganizationRow(membership.organizationId);
      if (!deleted.ok) {
        return { ok: false, reason: "no_membership" };
      }
      return {
        ok: true,
        action: "deleted",
        organizationId: membership.organizationId,
      };
    }

    if (membership.role === OWNER_ROLE) {
      const [ownerCountRow] = await db
        .select({ value: count() })
        .from(member)
        .where(
          and(eq(member.organizationId, membership.organizationId), eq(member.role, OWNER_ROLE)),
        );

      if (Number(ownerCountRow?.value ?? 0) <= 1) {
        return { ok: false, reason: "sole_owner_with_other_members" };
      }
    }

    const removed = await this.removeMember({
      organizationId: membership.organizationId,
      memberId: membership.memberId,
    });

    if (!removed.ok) {
      if (removed.reason === "cannot_remove_last_owner") {
        return { ok: false, reason: "sole_owner_with_other_members" };
      }
      return { ok: false, reason: "no_membership" };
    }

    return {
      ok: true,
      action: "left",
      organizationId: membership.organizationId,
    };
  }

  async acceptInvitationForUser(input: {
    invitationId: string;
    userId: string;
  }): Promise<AcceptInvitationForUserResult> {
    const db = this.uow.getDb();
    const [userRecord] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1);

    if (!userRecord) {
      return { ok: false, reason: "user_not_found" };
    }

    const [invite] = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organizationId: invitation.organizationId,
      })
      .from(invitation)
      .where(eq(invitation.id, input.invitationId))
      .limit(1);

    if (!invite) {
      return { ok: false, reason: "not_found" };
    }

    if (invite.status !== "pending") {
      return { ok: false, reason: "not_pending" };
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" };
    }

    if (invite.email.toLowerCase() !== userRecord.email.toLowerCase()) {
      return { ok: false, reason: "email_mismatch" };
    }

    const role = invite.role?.trim() || DEFAULT_INVITATION_ROLE;

    const added = await this.addOrganizationMemberRow({
      organizationId: invite.organizationId,
      userId: input.userId,
      role,
    });

    if (!added.ok) {
      return { ok: false, reason: added.reason };
    }

    await db
      .update(invitation)
      .set({ status: "accepted" })
      .where(and(eq(invitation.id, input.invitationId), eq(invitation.status, "pending")));

    return {
      ok: true,
      organizationId: invite.organizationId,
      memberId: added.memberId,
      role,
    };
  }

  async findPendingOrgIntentByEmail(email: string): Promise<PendingOrgIntent | null> {
    const db = this.uow.getDb();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const [pendingInvite] = await db
      .select({
        invitationId: invitation.id,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        role: invitation.role,
      })
      .from(invitation)
      .innerJoin(organization, eq(organization.id, invitation.organizationId))
      .where(
        and(
          sql`lower(${invitation.email}) = ${normalizedEmail}`,
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, now),
        ),
      )
      .limit(1);

    if (pendingInvite) {
      return {
        kind: "invitation",
        invitationId: pendingInvite.invitationId,
        organizationId: pendingInvite.organizationId,
        organizationName: pendingInvite.organizationName,
        role: pendingInvite.role,
      };
    }

    const [pendingSeat] = await db
      .select({
        seatId: organizationSeats.id,
        organizationId: organizationSeats.organizationId,
        organizationName: organization.name,
      })
      .from(organizationSeats)
      .innerJoin(organization, eq(organization.id, organizationSeats.organizationId))
      .where(
        and(
          sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
          eq(organizationSeats.status, "pending"),
        ),
      )
      .limit(1);

    if (pendingSeat) {
      return {
        kind: "seat",
        seatId: pendingSeat.seatId,
        organizationId: pendingSeat.organizationId,
        organizationName: pendingSeat.organizationName,
      };
    }

    return null;
  }

  async activateSeatForUser(input: { userId: string; email: string }): Promise<ActivateSeatResult> {
    const db = this.uow.getDb();
    const normalizedEmail = input.email.toLowerCase().trim();

    const [pendingSeat] = await db
      .select({
        seatId: organizationSeats.id,
        organizationId: organizationSeats.organizationId,
        status: organizationSeats.status,
      })
      .from(organizationSeats)
      .where(
        and(
          sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
          sql`${organizationSeats.status} IN ('pending', 'active')`,
        ),
      )
      .limit(1);

    if (!pendingSeat || pendingSeat.status !== "pending") {
      return { ok: false, reason: "no_pending_seat" };
    }

    const [existingMembership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, input.userId))
      .limit(1);

    if (existingMembership && existingMembership.organizationId !== pendingSeat.organizationId) {
      return { ok: false, reason: "user_in_other_org" };
    }

    const now = new Date();
    await db
      .update(organizationSeats)
      .set({
        status: "active",
        userId: input.userId,
        activatedAt: now,
        updatedAt: now,
      })
      .where(eq(organizationSeats.id, pendingSeat.seatId));

    if (!existingMembership) {
      await this.addOrganizationMemberRow({
        organizationId: pendingSeat.organizationId,
        userId: input.userId,
        role: ADDIN_USER_ROLE,
      });
    }

    return {
      ok: true,
      organizationId: pendingSeat.organizationId,
      activated: true,
    };
  }

  async setSessionActiveOrganization(input: {
    userId: string;
    organizationId: string;
    sessionId?: string;
  }): Promise<{ workspace: "solo" | "team" | null }> {
    const db = this.uow.getDb();
    const [org] = await db
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, input.organizationId))
      .limit(1);

    const type = getOrganizationType(org?.metadata);
    const workspace = type === "individual" ? "solo" : type === "team" ? "team" : null;

    if (input.sessionId) {
      await db
        .update(session)
        .set({
          activeOrganizationId: input.organizationId,
          ...(workspace ? { workspace } : {}),
        })
        .where(eq(session.id, input.sessionId));
    }

    await db
      .update(session)
      .set({
        activeOrganizationId: input.organizationId,
        ...(workspace ? { workspace } : {}),
      })
      .where(eq(session.userId, input.userId));

    return { workspace };
  }
}
