import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import type {
  createPlan,
  CreatePlanInput,
} from "@deck-pack/db/queries/createPlan";
import type { listOrganizationSubscriptions } from "@deck-pack/db/queries/listOrganizationSubscriptions";
import type { listPlans } from "@deck-pack/db/queries/listPlans";
import type { updateOrganizationSubscription } from "@deck-pack/db/queries/updateOrganizationSubscription";

export type BillingServiceDeps = {
  listPlans: typeof listPlans;
  createPlan: typeof createPlan;
  listOrganizationSubscriptions: typeof listOrganizationSubscriptions;
  createOrganizationSubscription: typeof createOrganizationSubscription;
  updateOrganizationSubscription: typeof updateOrganizationSubscription;
};

export function createBillingService(deps: BillingServiceDeps) {
  return {
    listPlans: async (tx: Transaction) => {
      const rows = await deps.listPlans({ tx });
      return serviceOk(rows);
    },

    createPlan: async (
      tx: Transaction,
      input: CreatePlanInput,
    ): Promise<
      ServiceResult<{
        id: string;
        name: string;
        slug: string;
        limits: CreatePlanInput["limits"];
        createdAt: Date;
        updatedAt: Date;
      }>
    > => {
      const result = await deps.createPlan({ tx, input });

      if (!result.ok) {
        if (result.reason === "invalid_limits") {
          return serviceFail("invalid_state", {
            message:
              "Provide a non-negative insert limit (or null for unlimited) for every asset type",
          });
        }
        return serviceFail("conflict", {
          message: "A plan with this slug already exists",
        });
      }

      return serviceOk({
        id: result.id,
        name: result.name,
        slug: result.slug,
        limits: result.limits,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    },

    listOrganizationSubscriptions: async (tx: Transaction) => {
      const rows = await deps.listOrganizationSubscriptions({ tx });
      return serviceOk(rows);
    },

    createOrganizationSubscription: async (
      tx: Transaction,
      input: { organizationId: string; planId: string; quantity: number },
    ): Promise<
      ServiceResult<{
        id: string;
        organizationId: string;
        planId: string;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    > => {
      const result = await deps.createOrganizationSubscription({ tx, input });

      if (!result.ok) {
        if (result.reason === "organization_not_found") {
          return serviceFail("not_found", { message: "Organization not found" });
        }
        if (result.reason === "plan_not_found") {
          return serviceFail("not_found", { message: "Plan not found" });
        }
        return serviceFail("conflict", {
          message: "This organization already has an active subscription",
        });
      }

      return serviceOk({
        id: result.id,
        organizationId: result.organizationId,
        planId: result.planId,
        quantity: result.quantity,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    },

    updateOrganizationSubscription: async (
      tx: Transaction,
      input: {
        subscriptionId: string;
        planId?: string;
        quantity?: number;
        status?: "active" | "canceled";
      },
    ): Promise<
      ServiceResult<{
        id: string;
        organizationId: string;
        planId: string;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    > => {
      const result = await deps.updateOrganizationSubscription({ tx, input });

      if (!result.ok) {
        if (result.reason === "plan_not_found") {
          return serviceFail("not_found", { message: "Plan not found" });
        }
        return serviceFail("not_found", { message: "Subscription not found" });
      }

      return serviceOk({
        id: result.id,
        organizationId: result.organizationId,
        planId: result.planId,
        quantity: result.quantity,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    },
  };
}

export type BillingService = ReturnType<typeof createBillingService>;
