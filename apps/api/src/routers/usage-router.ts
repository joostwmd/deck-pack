import { z } from "zod";

import { GetMemberUsage, GetUsageBySeat, GetUsageQuota, GetUsageSeries } from "@deck-pack/usage";
import {
  usageBySeatOutputSchema,
  usageMemberOutputSchema,
  usagePeriodInputSchema,
  usageQuotaOutputSchema,
  usageSeriesOutputSchema,
} from "@deck-pack/usage/schemas";

import type { AppContainer } from "../container";
import { requireActiveOrganizationId } from "../trpc/guards/assertions/require-active-organization-id";
import { requirePermission } from "../trpc/guards/middleware/require-permission";
import { organizationMemberProcedure, teamWorkspaceProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

const usageViewProcedure = organizationMemberProcedure.use(requirePermission({ usage: ["view"] }));

export function usageRouter(container: AppContainer) {
  return router({
    quota: usageViewProcedure.output(usageQuotaOutputSchema).query(({ ctx }) => {
      const organizationId = requireActiveOrganizationId(ctx);
      return new GetUsageQuota(container.usageRepository).execute({ organizationId });
    }),

    series: usageViewProcedure
      .input(usagePeriodInputSchema)
      .output(usageSeriesOutputSchema)
      .query(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new GetUsageSeries(container.usageRepository).execute({
          organizationId,
          period: input,
        });
      }),

    bySeat: teamWorkspaceProcedure
      .use(requirePermission({ usage: ["view"] }))
      .input(usagePeriodInputSchema)
      .output(usageBySeatOutputSchema)
      .query(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new GetUsageBySeat(container.usageRepository).execute({
          organizationId,
          period: input,
        });
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
      .query(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        const { userId, ...period } = input;
        return new GetMemberUsage(container.usageRepository).execute({
          organizationId,
          userId,
          period,
        });
      }),
  });
}
