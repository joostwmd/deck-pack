import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

import type { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import type { countAssignedSeats } from "@deck-pack/db/queries/countAssignedSeats";
import type { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import type { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import type { listOrganizationSeats } from "@deck-pack/db/queries/listOrganizationSeats";
import type { revokeOrganizationSeat } from "@deck-pack/db/queries/revokeOrganizationSeat";
import { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

export type SeatsServiceDeps = {
  getActiveOrganizationSubscriptionByOrgId: typeof getActiveOrganizationSubscriptionByOrgId;
  countAssignedSeats: typeof countAssignedSeats;
  listOrganizationSeats: typeof listOrganizationSeats;
  assignOrganizationSeat: typeof assignOrganizationSeat;
  revokeOrganizationSeat: typeof revokeOrganizationSeat;
  findUserByEmail: typeof findUserByEmail;
};

export function createSeatsService(deps: SeatsServiceDeps) {
  return {
    capacity: async (
      tx: Transaction,
      organizationId: string,
    ): Promise<ServiceResult<{ purchased: number; used: number; remaining: number }>> => {
      const subscription = await deps.getActiveOrganizationSubscriptionByOrgId({
        tx,
        organizationId,
      });

      const purchased = subscription?.quantity ?? 0;
      const used = await deps.countAssignedSeats({ tx, organizationId });

      return serviceOk({
        purchased,
        used,
        remaining: Math.max(0, purchased - used),
      });
    },

    list: async (tx: Transaction, organizationId: string) => {
      const rows = await deps.listOrganizationSeats({ tx, organizationId });
      return serviceOk(rows);
    },

    assign: async (
      tx: Transaction,
      input: {
        organizationId: string;
        email: string;
        assignedBy: string;
      },
    ) => {
      const existingUser = await deps.findUserByEmail({ tx, email: input.email });

      const result = await deps.assignOrganizationSeat({
        tx,
        input: {
          organizationId: input.organizationId,
          email: input.email,
          assignedBy: input.assignedBy,
          userId: existingUser?.id ?? null,
          status: existingUser ? "active" : "pending",
        },
      });

      if (!result.ok) {
        const reasonMap = {
          no_subscription: serviceFail("invalid_state", {
            message: "Organization has no active subscription",
          }),
          at_capacity: serviceFail("conflict", {
            message: "All purchased seats are assigned",
          }),
          email_already_assigned: serviceFail("conflict", {
            message: "This email already has a seat assignment",
          }),
          user_in_other_org: serviceFail("conflict", {
            message: "User already belongs to another organization",
          }),
        } as const;

        return reasonMap[result.reason];
      }

      if (existingUser && !existingUser.hasOrg) {
        await addOrganizationMember({
          tx,
          input: {
            organizationId: input.organizationId,
            userId: existingUser.id,
            role: ORGANIZATION_ROLES.addinUser,
          },
        });
      }

      return serviceOk(result);
    },

    revoke: async (tx: Transaction, input: { organizationId: string; seatId: string }) => {
      const result = await deps.revokeOrganizationSeat({
        tx,
        seatId: input.seatId,
        organizationId: input.organizationId,
      });

      if (!result.ok) {
        if (result.reason === "not_found") {
          return serviceFail("not_found", { message: "Seat not found" });
        }
        return serviceFail("invalid_state", { message: "Seat is already revoked" });
      }

      return serviceOk(result);
    },
  };
}

export type SeatsService = ReturnType<typeof createSeatsService>;
