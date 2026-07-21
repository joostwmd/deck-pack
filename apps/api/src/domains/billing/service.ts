import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

import type { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import type { createPlan, CreatePlanInput } from "@deck-pack/db/queries/createPlan";
import type { getOrganizationSubscription } from "@deck-pack/db/queries/getOrganizationSubscription";
import type { getPlan } from "@deck-pack/db/queries/getPlan";
import type { listOrganizationSubscriptions } from "@deck-pack/db/queries/listOrganizationSubscriptions";
import type { listPlans } from "@deck-pack/db/queries/listPlans";
import type { updateOrganizationSubscription } from "@deck-pack/db/queries/updateOrganizationSubscription";
import type { updatePlan, UpdatePlanInput } from "@deck-pack/db/queries/updatePlan";

export type BillingServiceDeps = {
  listPlans: typeof listPlans;
  getPlan: typeof getPlan;
  createPlan: typeof createPlan;
  updatePlan: typeof updatePlan;
  listOrganizationSubscriptions: typeof listOrganizationSubscriptions;
  getOrganizationSubscription: typeof getOrganizationSubscription;
  createOrganizationSubscription: typeof createOrganizationSubscription;
  updateOrganizationSubscription: typeof updateOrganizationSubscription;
};

type PlanResult = {
  id: string;
  name: string;
  slug: string;
  limits: CreatePlanInput["limits"];
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionMutationResult = {
  id: string;
  organizationId: string;
  planId: string;
  quantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createBillingService(deps: BillingServiceDeps) {
  return {
    listPlans: async (tx: Transaction) => {
      const rows = await deps.listPlans({ tx });
      return serviceOk(rows);
    },

    getPlan: async (
      tx: Transaction,
      input: { planId: string },
    ): Promise<ServiceResult<PlanResult>> => {
      const row = await deps.getPlan({ tx, planId: input.planId });
      if (!row) {
        return serviceFail("not_found", { message: "Plan not found" });
      }
      return serviceOk(row);
    },

    createPlan: async (
      tx: Transaction,
      input: CreatePlanInput,
    ): Promise<ServiceResult<PlanResult>> => {
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

    updatePlan: async (
      tx: Transaction,
      input: UpdatePlanInput,
    ): Promise<ServiceResult<PlanResult>> => {
      const result = await deps.updatePlan({ tx, input });

      if (!result.ok) {
        if (result.reason === "not_found") {
          return serviceFail("not_found", { message: "Plan not found" });
        }
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

    getOrganizationSubscription: async (tx: Transaction, input: { subscriptionId: string }) => {
      const row = await deps.getOrganizationSubscription({
        tx,
        subscriptionId: input.subscriptionId,
      });
      if (!row) {
        return serviceFail("not_found", { message: "Subscription not found" });
      }
      return serviceOk(row);
    },

    createOrganizationSubscription: async (
      tx: Transaction,
      input: { organizationId: string; planId: string; quantity: number },
    ): Promise<ServiceResult<SubscriptionMutationResult>> => {
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
    ): Promise<ServiceResult<SubscriptionMutationResult>> => {
      const result = await deps.updateOrganizationSubscription({ tx, input });

      if (!result.ok) {
        if (result.reason === "plan_not_found") {
          return serviceFail("not_found", { message: "Plan not found" });
        }
        if (result.reason === "already_subscribed") {
          return serviceFail("conflict", {
            message: "This organization already has an active subscription",
          });
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
