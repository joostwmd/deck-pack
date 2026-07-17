import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { createOrganizationWithOwner } from "@deck-pack/db/queries/createOrganizationWithOwner";
import type { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import type { listOrganizationsWithOwner } from "@deck-pack/db/queries/listOrganizationsWithOwner";

export type OrganizationServiceDeps = {
  findUserByEmail: typeof findUserByEmail;
  listOrganizationsWithOwner: typeof listOrganizationsWithOwner;
  createOrganizationWithOwner: typeof createOrganizationWithOwner;
};

export function createOrganizationService(deps: OrganizationServiceDeps) {
  return {
    lookupUser: async (
      tx: Transaction,
      input: { email: string },
    ): Promise<
      ServiceResult<
        | { found: true; name: string; email: string; hasOrg: boolean }
        | { found: false }
      >
    > => {
      const row = await deps.findUserByEmail({ tx, email: input.email });

      if (!row) {
        return serviceOk({ found: false as const });
      }

      return serviceOk({
        found: true as const,
        name: row.name,
        email: row.email,
        hasOrg: row.hasOrg,
      });
    },

    listOrganizations: async (tx: Transaction) => {
      const rows = await deps.listOrganizationsWithOwner({ tx });
      return serviceOk(rows);
    },

    createOrganization: async (
      tx: Transaction,
      input: { name: string; slug: string; ownerEmail: string },
    ): Promise<
      ServiceResult<{
        organizationId: string;
        userId: string;
        isNewUser: boolean;
      }>
    > => {
      const result = await deps.createOrganizationWithOwner({ tx, input });

      if (!result.ok) {
        if (result.reason === "slug_conflict") {
          return serviceFail("conflict", {
            message: "An organization with this slug already exists",
          });
        }

        return serviceFail("invalid_state", {
          message: "This user already belongs to an organization",
        });
      }

      return serviceOk({
        organizationId: result.organizationId,
        userId: result.userId,
        isNewUser: result.isNewUser,
      });
    },
  };
}

export type OrganizationService = ReturnType<typeof createOrganizationService>;
