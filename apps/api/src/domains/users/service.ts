import type { Transaction } from "@deck-pack/db/transaction";

import { serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { listUsersWithMembership } from "@deck-pack/db/queries/listUsersWithMembership";

export type UsersServiceDeps = {
  listUsersWithMembership: typeof listUsersWithMembership;
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
          memberRole: row.memberRole,
        })),
      );
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
