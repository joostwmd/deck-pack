import { z } from "zod";

import { platformAdminProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  organizationEmailSchema as emailSchema,
  organizationSlugSchema as slugSchema,
} from "./schemas";
import type { OrganizationService } from "./service";

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
      .output(
        z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            createdAt: z.date(),
            ownerEmail: z.string().nullable(),
          }),
        ),
      )
      .query(async ({ ctx }) => {
        return unwrapServiceResult(await service.listOrganizations(ctx.tx));
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
  };
}
