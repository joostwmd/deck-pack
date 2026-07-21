import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

import type { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import type { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import type { cancelInvitation } from "@deck-pack/db/queries/listPendingInvitations";
import type { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import type { listOrganizationMembers } from "@deck-pack/db/queries/listOrganizationMembers";
import type { listPendingInvitations } from "@deck-pack/db/queries/listPendingInvitations";
import type { removeOrganizationMember } from "@deck-pack/db/queries/removeOrganizationMember";
import type { updateOrganizationMemberRole } from "@deck-pack/db/queries/updateOrganizationMemberRole";
import type { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import type { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import type { getPlan } from "@deck-pack/db/queries/getPlan";
import type { getInvitationById } from "@deck-pack/db/queries/getInvitationById";
import type { getCurrentMembershipSummary } from "@deck-pack/db/queries/getCurrentMembershipSummary";
import type { vacateCurrentOrganization } from "@deck-pack/db/queries/vacateCurrentOrganization";
import type { acceptInvitationForUser } from "@deck-pack/db/queries/acceptInvitationForUser";
import type { findPendingOrgIntentByEmail } from "@deck-pack/db/queries/findPendingOrgIntentByEmail";
import type { activateSeatForUser } from "@deck-pack/db/queries/activateSeatForUser";
import type { setSessionActiveOrganization } from "@deck-pack/db/queries/setSessionActiveOrganization";
import { workspaceFromOrganizationType } from "@deck-pack/auth/workspace";

import type { createInvitationViaAuth } from "./create-invitation-via-auth";

export type MemberListEntry = {
  kind: "member" | "invitation";
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: "active" | "invited";
  createdAt: Date;
};

export type MembersServiceDeps = {
  listOrganizationMembers: typeof listOrganizationMembers;
  listPendingInvitations: typeof listPendingInvitations;
  findUserByEmail: typeof findUserByEmail;
  addOrganizationMember: typeof addOrganizationMember;
  createInvitation: typeof createInvitationViaAuth;
  updateOrganizationMemberRole: typeof updateOrganizationMemberRole;
  removeOrganizationMember: typeof removeOrganizationMember;
  cancelInvitation: typeof cancelInvitation;
  assignOrganizationSeat: typeof assignOrganizationSeat;
  getOrganizationMetadataById: typeof getOrganizationMetadataById;
  getActiveOrganizationSubscriptionByOrgId: typeof getActiveOrganizationSubscriptionByOrgId;
  getPlan: typeof getPlan;
  getInvitationById: typeof getInvitationById;
  getCurrentMembershipSummary: typeof getCurrentMembershipSummary;
  vacateCurrentOrganization: typeof vacateCurrentOrganization;
  acceptInvitationForUser: typeof acceptInvitationForUser;
  findPendingOrgIntentByEmail: typeof findPendingOrgIntentByEmail;
  activateSeatForUser: typeof activateSeatForUser;
  setSessionActiveOrganization: typeof setSessionActiveOrganization;
};

function membershipImpact(
  summary: Awaited<ReturnType<MembersServiceDeps["getCurrentMembershipSummary"]>>,
) {
  if (!summary) return null;
  return {
    organizationId: summary.organizationId,
    organizationName: summary.organizationName,
    organizationType: summary.organizationType,
    willDeleteOnVacate: summary.willDeleteOnVacate,
    blockedSoleOwner: summary.blockedSoleOwner,
  };
}

export function createMembersService(deps: MembersServiceDeps) {
  return {
    list: async (
      tx: Transaction,
      organizationId: string,
    ): Promise<ServiceResult<MemberListEntry[]>> => {
      const [members, invitations] = await Promise.all([
        deps.listOrganizationMembers({ tx, organizationId }),
        deps.listPendingInvitations({ tx, organizationId }),
      ]);

      const memberEntries: MemberListEntry[] = members.map((row) => ({
        kind: "member" as const,
        id: row.memberId,
        email: row.email,
        name: row.name,
        role: row.role,
        status: "active" as const,
        createdAt: row.createdAt,
      }));

      const invitationEntries: MemberListEntry[] = invitations.map((row) => ({
        kind: "invitation" as const,
        id: row.invitationId,
        email: row.email,
        name: null,
        role: row.role ?? "organizationMember",
        status: "invited" as const,
        createdAt: row.createdAt,
      }));

      return serviceOk(
        [...memberEntries, ...invitationEntries].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        ),
      );
    },

    add: async (
      tx: Transaction,
      input: {
        organizationId: string;
        email: string;
        role: string;
        assignSeat: boolean;
        inviterId: string;
        headers: Headers;
      },
    ): Promise<
      ServiceResult<
        { kind: "member"; memberId: string } | { kind: "invitation"; invitationId: string }
      >
    > => {
      const existingUser = await deps.findUserByEmail({ tx, email: input.email });

      if (existingUser && !existingUser.hasOrg) {
        const added = await deps.addOrganizationMember({
          tx,
          input: {
            organizationId: input.organizationId,
            userId: existingUser.id,
            role: input.role,
          },
        });

        if (!added.ok) {
          return serviceFail("conflict", { message: "User could not be added to organization" });
        }

        if (input.assignSeat) {
          const seat = await deps.assignOrganizationSeat({
            tx,
            input: {
              organizationId: input.organizationId,
              email: input.email,
              assignedBy: input.inviterId,
              userId: existingUser.id,
              status: "active",
            },
          });

          if (!seat.ok) {
            const seatMessages: Record<string, string> = {
              no_subscription: "Organization has no active subscription",
              at_capacity: "All purchased seats are assigned",
              email_already_assigned: "This email already has a seat assignment",
              user_in_other_org: "User already belongs to another organization",
            };
            return serviceFail("conflict", {
              message: seatMessages[seat.reason] ?? "Could not assign seat",
            });
          }
        }

        return serviceOk({ kind: "member" as const, memberId: added.memberId });
      }

      // Better Auth invite-member creates the row and triggers sendInvitationEmail (Resend).
      const invited = await deps.createInvitation({
        email: input.email,
        role: input.role,
        organizationId: input.organizationId,
        headers: input.headers,
      });

      if (!invited.ok) {
        const message =
          invited.reason === "already_member"
            ? "User is already a member"
            : invited.reason === "already_invited"
              ? "An invitation is already pending for this email"
              : invited.message;
        return serviceFail(invited.reason === "forbidden" ? "forbidden" : "conflict", { message });
      }

      if (input.assignSeat) {
        const seat = await deps.assignOrganizationSeat({
          tx,
          input: {
            organizationId: input.organizationId,
            email: input.email,
            assignedBy: input.inviterId,
          },
        });

        if (!seat.ok) {
          return serviceFail("conflict", {
            message: "Member invited but seat could not be assigned",
          });
        }
      }

      return serviceOk({ kind: "invitation" as const, invitationId: invited.invitationId });
    },

    updateRole: async (
      tx: Transaction,
      input: { organizationId: string; memberId: string; role: string },
    ) => {
      const result = await deps.updateOrganizationMemberRole({
        tx,
        input: {
          organizationId: input.organizationId,
          memberId: input.memberId,
          role: input.role,
        },
      });

      if (!result.ok) {
        if (result.reason === "not_found") {
          return serviceFail("not_found", { message: "Member not found" });
        }
        if (result.reason === "cannot_demote_last_owner") {
          return serviceFail("invalid_state", {
            message: "Cannot change role of the last organization owner",
          });
        }
        return serviceFail("invalid_state", { message: "Invalid role change" });
      }

      return serviceOk({ memberId: input.memberId });
    },

    remove: async (tx: Transaction, input: { organizationId: string; memberId: string }) => {
      const result = await deps.removeOrganizationMember({
        tx,
        organizationId: input.organizationId,
        memberId: input.memberId,
      });

      if (!result.ok) {
        if (result.reason === "not_found") {
          return serviceFail("not_found", { message: "Member not found" });
        }
        return serviceFail("invalid_state", {
          message: "Cannot remove the last organization owner",
        });
      }

      return serviceOk({ memberId: input.memberId });
    },

    cancelInvitation: async (
      tx: Transaction,
      input: { organizationId: string; invitationId: string },
    ) => {
      const result = await deps.cancelInvitation({
        tx,
        organizationId: input.organizationId,
        invitationId: input.invitationId,
      });

      if (!result.ok) {
        return serviceFail("not_found", { message: "Invitation not found" });
      }

      return serviceOk({ invitationId: input.invitationId });
    },

    getOrganizationProfile: async (tx: Transaction, organizationId: string) => {
      const org = await deps.getOrganizationMetadataById({ tx, organizationId });
      if (!org) {
        return serviceFail("not_found", { message: "Organization not found" });
      }

      const subscription = await deps.getActiveOrganizationSubscriptionByOrgId({
        tx,
        organizationId,
      });

      let plan: { id: string; name: string; slug: string; quantity: number } | null = null;
      if (subscription) {
        const planRow = await deps.getPlan({ tx, planId: subscription.planId });
        if (planRow) {
          plan = {
            id: planRow.id,
            name: planRow.name,
            slug: planRow.slug,
            quantity: subscription.quantity,
          };
        }
      }

      return serviceOk({
        type: org.type,
        workspace: workspaceFromOrganizationType(org.type),
        plan,
      });
    },

    getInvitationPreview: async (
      tx: Transaction,
      input: { invitationId: string; userId: string; userEmail: string },
    ) => {
      const invite = await deps.getInvitationById({ tx, invitationId: input.invitationId });
      if (!invite) {
        return serviceFail("not_found", { message: "Invitation not found" });
      }

      if (invite.email.toLowerCase() !== input.userEmail.toLowerCase()) {
        return serviceFail("forbidden", {
          message: "This invitation was sent to a different email address",
        });
      }

      const current = await deps.getCurrentMembershipSummary({ tx, userId: input.userId });

      return serviceOk({
        invitationId: invite.invitationId,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        organizationId: invite.organizationId,
        organizationName: invite.organizationName,
        organizationType: invite.organizationType,
        status: invite.status,
        currentMembership: membershipImpact(current),
      });
    },

    acceptInvitation: async (
      tx: Transaction,
      input: {
        invitationId: string;
        userId: string;
        sessionId: string;
        confirmReplace: boolean;
      },
    ) => {
      const invite = await deps.getInvitationById({ tx, invitationId: input.invitationId });
      if (!invite) {
        return serviceFail("not_found", { message: "Invitation not found" });
      }
      if (invite.status !== "pending") {
        return serviceFail("invalid_state", { message: "Invitation is no longer pending" });
      }
      if (invite.expiresAt.getTime() <= Date.now()) {
        return serviceFail("invalid_state", { message: "Invitation has expired" });
      }

      const current = await deps.getCurrentMembershipSummary({ tx, userId: input.userId });
      let vacatedAction: "deleted" | "left" | null = null;

      if (current) {
        if (current.organizationId === invite.organizationId) {
          return serviceFail("conflict", {
            message: "You are already a member of this organization",
          });
        }

        if (current.blockedSoleOwner) {
          return serviceFail("invalid_state", {
            message:
              "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
          });
        }

        if (!input.confirmReplace) {
          return serviceFail("conflict", {
            message: "You already belong to an organization. Confirm replacing it to continue.",
          });
        }

        const vacated = await deps.vacateCurrentOrganization({ tx, userId: input.userId });
        if (!vacated.ok) {
          if (vacated.reason === "sole_owner_with_other_members") {
            return serviceFail("invalid_state", {
              message:
                "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
            });
          }
          return serviceFail("invalid_state", {
            message: "Could not leave your current organization",
          });
        }
        vacatedAction = vacated.action;
      }

      const accepted = await deps.acceptInvitationForUser({
        tx,
        invitationId: input.invitationId,
        userId: input.userId,
      });

      if (!accepted.ok) {
        const messages: Record<string, string> = {
          not_found: "Invitation not found",
          not_pending: "Invitation is no longer pending",
          expired: "Invitation has expired",
          email_mismatch: "This invitation was sent to a different email address",
          user_not_found: "User not found",
          already_member: "You are already a member of this organization",
          user_in_other_org: "You still belong to another organization",
        };
        return serviceFail("conflict", {
          message: messages[accepted.reason] ?? "Could not accept invitation",
        });
      }

      const { workspace } = await deps.setSessionActiveOrganization({
        tx,
        userId: input.userId,
        organizationId: accepted.organizationId,
        sessionId: input.sessionId,
      });

      return serviceOk({
        organizationId: accepted.organizationId,
        workspace,
        vacatedAction,
      });
    },

    getPendingJoin: async (tx: Transaction, input: { userId: string; userEmail: string }) => {
      const intent = await deps.findPendingOrgIntentByEmail({
        tx,
        email: input.userEmail,
      });
      if (!intent) {
        return serviceOk(null);
      }

      const current = await deps.getCurrentMembershipSummary({ tx, userId: input.userId });

      if (current?.organizationId === intent.organizationId) {
        return serviceOk(null);
      }

      // Seat auto-activates when user has no org; only surface when replace is needed
      // or when invitation is pending (always needs accept).
      if (intent.kind === "seat" && !current) {
        return serviceOk(null);
      }

      return serviceOk({
        kind: intent.kind,
        invitationId: intent.kind === "invitation" ? intent.invitationId : undefined,
        seatId: intent.kind === "seat" ? intent.seatId : undefined,
        organizationId: intent.organizationId,
        organizationName: intent.organizationName,
        role: intent.kind === "invitation" ? intent.role : null,
        currentMembership: membershipImpact(current),
      });
    },

    acceptPendingSeat: async (
      tx: Transaction,
      input: {
        userId: string;
        userEmail: string;
        sessionId: string;
        confirmReplace: boolean;
      },
    ) => {
      const intent = await deps.findPendingOrgIntentByEmail({
        tx,
        email: input.userEmail,
      });

      if (!intent || intent.kind !== "seat") {
        return serviceFail("not_found", { message: "No pending seat assignment found" });
      }

      const current = await deps.getCurrentMembershipSummary({ tx, userId: input.userId });
      let vacatedAction: "deleted" | "left" | null = null;

      if (current) {
        if (current.organizationId === intent.organizationId) {
          const activated = await deps.activateSeatForUser({
            tx,
            userId: input.userId,
            email: input.userEmail,
          });
          if (!activated.ok) {
            return serviceFail("conflict", { message: "Could not activate seat" });
          }
          const { workspace } = await deps.setSessionActiveOrganization({
            tx,
            userId: input.userId,
            organizationId: intent.organizationId,
            sessionId: input.sessionId,
          });
          return serviceOk({
            organizationId: intent.organizationId,
            workspace,
            vacatedAction: null,
          });
        }

        if (current.blockedSoleOwner) {
          return serviceFail("invalid_state", {
            message:
              "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
          });
        }

        if (!input.confirmReplace) {
          return serviceFail("conflict", {
            message: "You already belong to an organization. Confirm replacing it to continue.",
          });
        }

        const vacated = await deps.vacateCurrentOrganization({ tx, userId: input.userId });
        if (!vacated.ok) {
          if (vacated.reason === "sole_owner_with_other_members") {
            return serviceFail("invalid_state", {
              message:
                "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
            });
          }
          return serviceFail("invalid_state", {
            message: "Could not leave your current organization",
          });
        }
        vacatedAction = vacated.action;
      }

      const activated = await deps.activateSeatForUser({
        tx,
        userId: input.userId,
        email: input.userEmail,
      });

      if (!activated.ok) {
        return serviceFail("conflict", {
          message:
            activated.reason === "user_in_other_org"
              ? "You still belong to another organization"
              : "No pending seat assignment found",
        });
      }

      const { workspace } = await deps.setSessionActiveOrganization({
        tx,
        userId: input.userId,
        organizationId: activated.organizationId,
        sessionId: input.sessionId,
      });

      return serviceOk({
        organizationId: activated.organizationId,
        workspace,
        vacatedAction,
      });
    },
  };
}

export type MembersService = ReturnType<typeof createMembersService>;
