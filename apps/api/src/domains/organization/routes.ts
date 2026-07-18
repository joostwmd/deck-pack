import { z } from "zod";

import { platformAdminProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  organizationEmailSchema as emailSchema,
  organizationSlugSchema as slugSchema,
} from "./schemas";
import type { OrganizationService } from "./service";

const organizationIdSchema = z.string().trim().min(1);

const organizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  ownerEmail: z.string().nullable(),
});

const organizationDetailSchema = organizationSummarySchema.extend({
  ownerName: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
});

const organizationMemberSchema = z.object({
  memberId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export function createOrganizationRoutes(service: OrganizationService) {
  return {
    lookupUser: platformAdminProcedure
      .input(z.object({ email: emailSchema }))
      .output(
        z.discriminatedUnion("found", [
          z.object({
            found: z.literal(true),
            name: z.string(),
            email: z.string(),
            hasOrg: z.boolean(),
          }),
          z.object({ found: z.literal(false) }),
        ]),
      )
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.lookupUser(ctx.tx, { email: input.email }));
      }),

    listOrganizations: platformAdminProcedure
      .output(z.array(organizationSummarySchema))
      .query(async ({ ctx }) => {
        return unwrapServiceResult(await service.listOrganizations(ctx.tx));
      }),

    getOrganization: platformAdminProcedure
      .input(z.object({ organizationId: organizationIdSchema }))
      .output(organizationDetailSchema)
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.getOrganization(ctx.tx, { organizationId: input.organizationId }),
        );
      }),

    listMembers: platformAdminProcedure
      .input(z.object({ organizationId: organizationIdSchema }))
      .output(z.array(organizationMemberSchema))
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.listMembers(ctx.tx, { organizationId: input.organizationId }),
        );
      }),

    createOrganization: platformAdminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(256),
          slug: slugSchema,
          ownerEmail: emailSchema,
        }),
      )
      .output(
        z.object({
          organizationId: z.string(),
          userId: z.string(),
          isNewUser: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.createOrganization(ctx.tx, input));
      }),

    updateOrganization: platformAdminProcedure
      .input(
        z.object({
          organizationId: organizationIdSchema,
          name: z.string().trim().min(1).max(256),
          slug: slugSchema,
        }),
      )
      .output(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          createdAt: z.date(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.updateOrganization(ctx.tx, input));
      }),
  };
}
