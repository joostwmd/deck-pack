import { z } from "zod";

import { platformAdminProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  organizationSubscriptionSchema,
  planLimitsInputSchema,
  planSchema,
  planSlugSchema,
} from "./schemas";
import type { BillingService } from "./service";

export function createBillingRoutes(service: BillingService) {
  return {
    listPlans: platformAdminProcedure.output(z.array(planSchema)).query(async ({ ctx }) => {
      return unwrapServiceResult(await service.listPlans(ctx.tx));
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
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.createPlan(ctx.tx, input));
      }),

    listOrganizationSubscriptions: platformAdminProcedure
      .output(z.array(organizationSubscriptionSchema))
      .query(async ({ ctx }) => {
        return unwrapServiceResult(await service.listOrganizationSubscriptions(ctx.tx));
      }),

    createOrganizationSubscription: platformAdminProcedure
      .input(
        z.object({
          organizationId: z.string().trim().min(1),
          planId: z.string().trim().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .output(
        z.object({
          id: z.string(),
          organizationId: z.string(),
          planId: z.string(),
          quantity: z.number().int(),
          status: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.createOrganizationSubscription(ctx.tx, input));
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
      .output(
        z.object({
          id: z.string(),
          organizationId: z.string(),
          planId: z.string(),
          quantity: z.number().int(),
          status: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.updateOrganizationSubscription(ctx.tx, input));
      }),
  };
}
