import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

import type { deleteUser } from "@deck-pack/db/queries/deleteUser";
import type { listUsersWithMembership } from "@deck-pack/db/queries/listUsersWithMembership";

export type UsersServiceDeps = {
  listUsersWithMembership: typeof listUsersWithMembership;
  deleteUser: typeof deleteUser;
};

export function createUsersService(deps: UsersServiceDeps) {
  return {
    listUsers: async (
      tx: Transaction,
    ): Promise<
      ServiceResult<
        Array<{
          id: string;
          name: string;
          email: string;
          role: string | null;
          emailVerified: boolean;
          banned: boolean;
          createdAt: Date;
          organizationId: string | null;
          organizationName: string | null;
          organizationSlug: string | null;
          organizationType: "individual" | "team" | null;
          memberRole: string | null;
        }>
      >
    > => {
      const rows = await deps.listUsersWithMembership({ tx });

      return serviceOk(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          emailVerified: row.emailVerified,
          banned: Boolean(row.banned),
          createdAt: row.createdAt,
          organizationId: row.organizationId,
          organizationName: row.organizationName,
          organizationSlug: row.organizationSlug,
          organizationType: row.organizationType,
          memberRole: row.memberRole,
        })),
      );
    },

    deleteUser: async (
      tx: Transaction,
      input: { userId: string; actorUserId: string },
    ): Promise<ServiceResult<{ userId: string }>> => {
      if (input.userId === input.actorUserId) {
        return serviceFail("invalid_state", {
          message: "You cannot delete your own account",
        });
      }

      const result = await deps.deleteUser({ tx, userId: input.userId });

      if (!result.ok) {
        return serviceFail("not_found", { message: "User not found" });
      }

      return serviceOk({ userId: result.userId });
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
