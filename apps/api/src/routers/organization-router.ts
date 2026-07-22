import { z } from "zod";

import {
  CreateOrganization,
  DeleteOrganization,
  GetOrganization,
  ListOrganizationMembers,
  ListOrganizations,
  LookupUserByEmail,
  UpdateOrganization,
} from "@deck-pack/organization";
import {
  createOrganizationInputSchema,
  organizationDetailSchema,
  organizationEmailSchema,
  organizationIdSchema,
  organizationMemberSchema,
  organizationSummarySchema,
  organizationTypeSchema,
  updateOrganizationInputSchema,
} from "@deck-pack/organization/schemas";

import type { AppContainer } from "../container";
import { platformAdminProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function organizationRouter(container: AppContainer) {
  return router({
    lookupUser: platformAdminProcedure
      .input(z.object({ email: organizationEmailSchema }))
      .output(
        z.discriminatedUnion("found", [
          z.object({
            found: z.literal(true),
            id: z.string(),
            name: z.string(),
            email: z.string(),
            hasOrg: z.boolean(),
          }),
          z.object({ found: z.literal(false) }),
        ]),
      )
      .query(({ input }) =>
        new LookupUserByEmail(container.organizationRepository).execute({ email: input.email }),
      ),

    listOrganizations: platformAdminProcedure
      .output(z.array(organizationSummarySchema))
      .query(() => new ListOrganizations(container.organizationRepository).execute()),

    getOrganization: platformAdminProcedure
      .input(z.object({ organizationId: organizationIdSchema }))
      .output(organizationDetailSchema)
      .query(({ input }) =>
        new GetOrganization(container.organizationRepository).execute({
          organizationId: input.organizationId,
        }),
      ),

    listMembers: platformAdminProcedure
      .input(z.object({ organizationId: organizationIdSchema }))
      .output(z.array(organizationMemberSchema))
      .query(({ input }) =>
        new ListOrganizationMembers(container.organizationRepository).execute({
          organizationId: input.organizationId,
        }),
      ),

    createOrganization: platformAdminProcedure
      .input(createOrganizationInputSchema)
      .output(
        z.object({
          organizationId: z.string(),
          userId: z.string(),
          isNewUser: z.boolean(),
        }),
      )
      .mutation(({ input }) =>
        new CreateOrganization(container.organizationRepository).execute(input),
      ),

    updateOrganization: platformAdminProcedure
      .input(updateOrganizationInputSchema)
      .output(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          createdAt: z.date(),
          type: organizationTypeSchema.nullable(),
        }),
      )
      .mutation(({ input }) =>
        new UpdateOrganization(container.organizationRepository).execute(input),
      ),

    deleteOrganization: platformAdminProcedure
      .input(z.object({ organizationId: organizationIdSchema }))
      .output(z.object({ organizationId: z.string() }))
      .mutation(({ input }) =>
        new DeleteOrganization(container.organizationRepository).execute({
          organizationId: input.organizationId,
        }),
      ),
  });
}
