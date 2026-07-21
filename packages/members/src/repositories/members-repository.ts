import { and, asc, count, eq } from "drizzle-orm";

import { acceptInvitationForUser } from "@deck-pack/db/queries/acceptInvitationForUser";
import { activateSeatForUser } from "@deck-pack/db/queries/activateSeatForUser";
import { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import { findPendingOrgIntentByEmail } from "@deck-pack/db/queries/findPendingOrgIntentByEmail";
import { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import { getCurrentMembershipSummary } from "@deck-pack/db/queries/getCurrentMembershipSummary";
import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import { getPlan } from "@deck-pack/db/queries/getPlan";
import { removeOrganizationMember } from "@deck-pack/db/queries/removeOrganizationMember";
import { vacateCurrentOrganization } from "@deck-pack/db/queries/vacateCurrentOrganization";
import { getOrganizationType } from "@deck-pack/db/org-metadata";
import { invitation, member, organization, session, user } from "@deck-pack/db/schema/auth";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

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

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async listMembers(organizationId: string): Promise<OrganizationMemberRow[]> {
    const tx = this.tx();
    return tx
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
    const tx = this.tx();
    return tx
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

  async findUserByEmail(email: string): Promise<UserByEmail | null> {
    return findUserByEmail({ tx: this.tx(), email });
  }

  async addMember(input: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<AddOrganizationMemberResult> {
    return addOrganizationMember({ tx: this.tx(), input });
  }

  async updateMemberRole(input: {
    organizationId: string;
    memberId: string;
    role: string;
  }): Promise<UpdateMemberRoleResult> {
    const tx = this.tx();
    const [target] = await tx
      .select({ id: member.id, role: member.role })
      .from(member)
      .where(and(eq(member.id, input.memberId), eq(member.organizationId, input.organizationId)))
      .limit(1);

    if (!target) {
      return { ok: false, reason: "not_found" };
    }

    if (target.role === OWNER_ROLE && input.role !== OWNER_ROLE) {
      const [ownerCount] = await tx
        .select({ value: count() })
        .from(member)
        .where(and(eq(member.organizationId, input.organizationId), eq(member.role, OWNER_ROLE)));

      if (Number(ownerCount?.value ?? 0) <= 1) {
        return { ok: false, reason: "cannot_demote_last_owner" };
      }
    }

    await tx.update(member).set({ role: input.role }).where(eq(member.id, input.memberId));

    return { ok: true };
  }

  async removeMember(input: {
    organizationId: string;
    memberId: string;
  }): Promise<RemoveMemberResult> {
    return removeOrganizationMember({
      tx: this.tx(),
      organizationId: input.organizationId,
      memberId: input.memberId,
    });
  }

  async cancelInvitation(input: {
    organizationId: string;
    invitationId: string;
  }): Promise<CancelInvitationResult> {
    const tx = this.tx();
    const [row] = await tx
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

    await tx
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
    return assignOrganizationSeat({ tx: this.tx(), input });
  }

  async getOrganizationMetadata(
    organizationId: string,
  ): Promise<{ metadata: string | null; type: "individual" | "team" | null } | null> {
    return getOrganizationMetadataById({ tx: this.tx(), organizationId });
  }

  async getActiveSubscription(
    organizationId: string,
  ): Promise<{ planId: string; quantity: number } | null> {
    const subscription = await getActiveOrganizationSubscriptionByOrgId({
      tx: this.tx(),
      organizationId,
    });
    if (!subscription) return null;
    return { planId: subscription.planId, quantity: subscription.quantity };
  }

  async getPlan(planId: string): Promise<{ id: string; name: string; slug: string } | null> {
    const plan = await getPlan({ tx: this.tx(), planId });
    if (!plan) return null;
    return { id: plan.id, name: plan.name, slug: plan.slug };
  }

  async getInvitationById(invitationId: string): Promise<InvitationDetails | null> {
    const tx = this.tx();
    const [row] = await tx
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
    return getCurrentMembershipSummary({ tx: this.tx(), userId });
  }

  async vacateCurrentOrganization(userId: string): Promise<VacateResult> {
    return vacateCurrentOrganization({ tx: this.tx(), userId });
  }

  async acceptInvitationForUser(input: {
    invitationId: string;
    userId: string;
  }): Promise<AcceptInvitationForUserResult> {
    return acceptInvitationForUser({
      tx: this.tx(),
      invitationId: input.invitationId,
      userId: input.userId,
    });
  }

  async findPendingOrgIntentByEmail(email: string): Promise<PendingOrgIntent | null> {
    return findPendingOrgIntentByEmail({ tx: this.tx(), email });
  }

  async activateSeatForUser(input: { userId: string; email: string }): Promise<ActivateSeatResult> {
    return activateSeatForUser({ tx: this.tx(), userId: input.userId, email: input.email });
  }

  async setSessionActiveOrganization(input: {
    userId: string;
    organizationId: string;
    sessionId?: string;
  }): Promise<{ workspace: "solo" | "team" | null }> {
    const tx = this.tx();
    const [org] = await tx
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, input.organizationId))
      .limit(1);

    const type = getOrganizationType(org?.metadata);
    const workspace = type === "individual" ? "solo" : type === "team" ? "team" : null;

    if (input.sessionId) {
      await tx
        .update(session)
        .set({
          activeOrganizationId: input.organizationId,
          ...(workspace ? { workspace } : {}),
        })
        .where(eq(session.id, input.sessionId));
    }

    await tx
      .update(session)
      .set({
        activeOrganizationId: input.organizationId,
        ...(workspace ? { workspace } : {}),
      })
      .where(eq(session.userId, input.userId));

    return { workspace };
  }
}
