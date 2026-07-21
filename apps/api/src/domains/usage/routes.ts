import { z } from "zod";

import { organizationMemberProcedure, teamWorkspaceProcedure } from "../../trpc/procedures";
import { requirePermission } from "../../trpc/guards/middleware/require-permission";
import { requireActiveOrganizationId } from "../../trpc/guards/assertions/require-active-organization-id";
import { unwrapServiceResult } from "../../trpc/service-result";

import {
  usageBySeatOutputSchema,
  usageMemberOutputSchema,
  usagePeriodInputSchema,
  usageQuotaOutputSchema,
  usageSeriesOutputSchema,
} from "./schemas";
import type { UsageService } from "./service";

export const usageViewProcedure = organizationMemberProcedure.use(
  requirePermission({ usage: ["view"] }),
);

export function createUsageRoutes(service: UsageService) {
  return {
    quota: usageViewProcedure.output(usageQuotaOutputSchema).query(async ({ ctx }) => {
      const organizationId = requireActiveOrganizationId(ctx);
      return unwrapServiceResult(await service.quota(ctx.tx, organizationId));
    }),

    series: usageViewProcedure
      .input(usagePeriodInputSchema)
      .output(usageSeriesOutputSchema)
      .query(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(await service.series(ctx.tx, { organizationId, period: input }));
      }),

    bySeat: teamWorkspaceProcedure
      .use(requirePermission({ usage: ["view"] }))
      .input(usagePeriodInputSchema)
      .output(usageBySeatOutputSchema)
      .query(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(await service.bySeat(ctx.tx, { organizationId, period: input }));
      }),

    member: usageViewProcedure
      .input(
        z.intersection(
          usagePeriodInputSchema,
          z.object({
            userId: z.string(),
          }),
        ),
      )
      .output(usageMemberOutputSchema)
      .query(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        const { userId, ...period } = input;
        return unwrapServiceResult(
          await service.member(ctx.tx, {
            organizationId,
            userId,
            period,
          }),
        );
      }),
  };
}
