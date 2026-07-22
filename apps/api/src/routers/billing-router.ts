import { z } from "zod";

import {
  CreateOrganizationSubscription,
  CreatePlan,
  GetOrganizationSubscription,
  GetPlan,
  ListOrganizationSubscriptions,
  ListPlans,
  UpdateOrganizationSubscription,
  UpdatePlan,
} from "@deck-pack/billing";
import {
  organizationSubscriptionSchema,
  planLimitsInputSchema,
  planSchema,
  planSlugSchema,
  subscriptionMutationSchema,
} from "@deck-pack/billing/schemas";

import type { AppContainer } from "../container";
import { platformAdminProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function billingRouter(container: AppContainer) {
  return router({
    listPlans: platformAdminProcedure.output(z.array(planSchema)).query(() => {
      return new ListPlans(container.billingRepository).execute();
    }),

    getPlan: platformAdminProcedure
      .input(z.object({ planId: z.string().trim().min(1) }))
      .output(planSchema)
      .query(({ input }) => {
        return new GetPlan(container.billingRepository).execute(input);
      }),

    createPlan: platformAdminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(256),
          slug: planSlugSchema,
          limits: planLimitsInputSchema,
        }),
      )
      .output(planSchema)
      .mutation(({ input }) => {
        return new CreatePlan(container.billingRepository).execute(input);
      }),

    updatePlan: platformAdminProcedure
      .input(
        z.object({
          planId: z.string().trim().min(1),
          name: z.string().trim().min(1).max(256),
          slug: planSlugSchema,
          limits: planLimitsInputSchema,
        }),
      )
      .output(planSchema)
      .mutation(({ input }) => {
        return new UpdatePlan(container.billingRepository).execute(input);
      }),

    listOrganizationSubscriptions: platformAdminProcedure
      .output(z.array(organizationSubscriptionSchema))
      .query(() => {
        return new ListOrganizationSubscriptions(container.billingRepository).execute();
      }),

    getOrganizationSubscription: platformAdminProcedure
      .input(z.object({ subscriptionId: z.string().trim().min(1) }))
      .output(organizationSubscriptionSchema)
      .query(({ input }) => {
        return new GetOrganizationSubscription(container.billingRepository).execute(input);
      }),

    createOrganizationSubscription: platformAdminProcedure
      .input(
        z.object({
          organizationId: z.string().trim().min(1),
          planId: z.string().trim().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .output(subscriptionMutationSchema)
      .mutation(({ input }) => {
        return new CreateOrganizationSubscription(container.billingRepository).execute(input);
      }),

    updateOrganizationSubscription: platformAdminProcedure
      .input(
        z
          .object({
            subscriptionId: z.string().trim().min(1),
            planId: z.string().trim().min(1).optional(),
            quantity: z.number().int().positive().optional(),
            status: z.enum(["active", "canceled"]).optional(),
          })
          .refine(
            (value) =>
              value.planId !== undefined ||
              value.quantity !== undefined ||
              value.status !== undefined,
            { message: "Provide at least one field to update" },
          ),
      )
      .output(subscriptionMutationSchema)
      .mutation(({ input }) => {
        return new UpdateOrganizationSubscription(container.billingRepository).execute(input);
      }),
  });
}
