import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { createOrganizationWithOwner } from "@deck-pack/db/queries/createOrganizationWithOwner";
import type { deleteOrganization } from "@deck-pack/db/queries/deleteOrganization";
import type { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import type { getOrganizationWithOwner } from "@deck-pack/db/queries/getOrganizationWithOwner";
import type { listOrganizationMembers } from "@deck-pack/db/queries/listOrganizationMembers";
import type { listOrganizationsWithOwner } from "@deck-pack/db/queries/listOrganizationsWithOwner";
import type { updateOrganization } from "@deck-pack/db/queries/updateOrganization";

export type OrganizationServiceDeps = {
  findUserByEmail: typeof findUserByEmail;
  listOrganizationsWithOwner: typeof listOrganizationsWithOwner;
  createOrganizationWithOwner: typeof createOrganizationWithOwner;
  getOrganizationWithOwner: typeof getOrganizationWithOwner;
  listOrganizationMembers: typeof listOrganizationMembers;
  updateOrganization: typeof updateOrganization;
  deleteOrganization: typeof deleteOrganization;
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

    getOrganization: async (
      tx: Transaction,
      input: { organizationId: string },
    ): Promise<
      ServiceResult<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        ownerEmail: string | null;
        ownerName: string | null;
        memberCount: number;
      }>
    > => {
      const row = await deps.getOrganizationWithOwner({
        tx,
        organizationId: input.organizationId,
      });

      if (!row) {
        return serviceFail("not_found", { message: "Organization not found" });
      }

      return serviceOk(row);
    },

    listMembers: async (
      tx: Transaction,
      input: { organizationId: string },
    ): Promise<
      ServiceResult<
        Array<{
          memberId: string;
          userId: string;
          name: string;
          email: string;
          role: string;
          createdAt: Date;
        }>
      >
    > => {
      const org = await deps.getOrganizationWithOwner({
        tx,
        organizationId: input.organizationId,
      });

      if (!org) {
        return serviceFail("not_found", { message: "Organization not found" });
      }

      const members = await deps.listOrganizationMembers({
        tx,
        organizationId: input.organizationId,
      });

      return serviceOk(members);
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

    updateOrganization: async (
      tx: Transaction,
      input: { organizationId: string; name: string; slug: string },
    ): Promise<
      ServiceResult<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
      }>
    > => {
      const result = await deps.updateOrganization({ tx, input });

      if (!result.ok) {
        if (result.reason === "slug_conflict") {
          return serviceFail("conflict", {
            message: "An organization with this slug already exists",
          });
        }

        return serviceFail("not_found", { message: "Organization not found" });
      }

      return serviceOk({
        id: result.id,
        name: result.name,
        slug: result.slug,
        createdAt: result.createdAt,
      });
    },

    deleteOrganization: async (
      tx: Transaction,
      input: { organizationId: string },
    ): Promise<ServiceResult<{ organizationId: string }>> => {
      const result = await deps.deleteOrganization({
        tx,
        organizationId: input.organizationId,
      });

      if (!result.ok) {
        return serviceFail("not_found", { message: "Organization not found" });
      }

      return serviceOk({ organizationId: result.organizationId });
    },
  };
}

export type OrganizationService = ReturnType<typeof createOrganizationService>;
