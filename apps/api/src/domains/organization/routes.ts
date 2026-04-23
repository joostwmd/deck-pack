import { z } from "zod";
import { organizationMemberProcedure } from "../../api/procedures";
import { hasPermission } from "../../api/guards/authorization";

export const systemRoutes = {
  getOrganization: organizationMemberProcedure
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .query(({ ctx }) => {
      return {
        id: ctx.session!.session.activeOrganizationId!,
        name: "this is ne name",
      };
    }),

  someOrgAdminOperation: organizationMemberProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx }) => {
      // Check specific permissions for admin operations
      await hasPermission(ctx.headers, { organization: ["update"] });

      return {
        message: "This is an organization admin operation",
      };
    }),

  someOrgMemberOperation: organizationMemberProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx }) => {
      // Members can create projects
      await hasPermission(ctx.headers, { project: ["create"] });

      return {
        message: "This is an organization member operation",
      };
    }),

  someOrgOwnerOperation: organizationMemberProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx }) => {
      // Only owners can delete the organization
      await hasPermission(ctx.headers, { organization: ["delete"] });

      return {
        message: "This is an organization owner operation",
      };
    }),
};
