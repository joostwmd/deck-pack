import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import type { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import type { cancelInvitation } from "@deck-pack/db/queries/listPendingInvitations";
import type { createOrganizationInvitation } from "@deck-pack/db/queries/createOrganizationInvitation";
import type { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import type { listOrganizationMembers } from "@deck-pack/db/queries/listOrganizationMembers";
import type { listPendingInvitations } from "@deck-pack/db/queries/listPendingInvitations";
import type { removeOrganizationMember } from "@deck-pack/db/queries/removeOrganizationMember";
import type { updateOrganizationMemberRole } from "@deck-pack/db/queries/updateOrganizationMemberRole";
import type { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import type { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import type { getPlan } from "@deck-pack/db/queries/getPlan";
import { workspaceFromOrganizationType } from "@deck-pack/auth/workspace";

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
  createOrganizationInvitation: typeof createOrganizationInvitation;
  updateOrganizationMemberRole: typeof updateOrganizationMemberRole;
  removeOrganizationMember: typeof removeOrganizationMember;
  cancelInvitation: typeof cancelInvitation;
  assignOrganizationSeat: typeof assignOrganizationSeat;
  getOrganizationMetadataById: typeof getOrganizationMetadataById;
  getActiveOrganizationSubscriptionByOrgId: typeof getActiveOrganizationSubscriptionByOrgId;
  getPlan: typeof getPlan;
};

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
      },
    ): Promise<
      ServiceResult<
        | { kind: "member"; memberId: string }
        | { kind: "invitation"; invitationId: string }
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

      const invited = await deps.createOrganizationInvitation({
        tx,
        input: {
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          inviterId: input.inviterId,
        },
      });

      if (!invited.ok) {
        const message =
          invited.reason === "already_member"
            ? "User is already a member"
            : "An invitation is already pending for this email";
        return serviceFail("conflict", { message });
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

    remove: async (
      tx: Transaction,
      input: { organizationId: string; memberId: string },
    ) => {
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
  };
}

export type MembersService = ReturnType<typeof createMembersService>;
