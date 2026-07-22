import { TrackAssetInsertion } from "@deck-pack/usage";
import {
  trackAssetInsertionInputSchema,
  trackAssetInsertionOutputSchema,
} from "@deck-pack/usage/schemas";

import type { AppContainer } from "../container";
import { requireActiveOrganizationId } from "../trpc/guards/assertions/require-active-organization-id";
import { addinLicensedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function addinRouter(container: AppContainer) {
  return router({
    insertions: router({
      track: addinLicensedProcedure
        .input(trackAssetInsertionInputSchema)
        .output(trackAssetInsertionOutputSchema)
        .mutation(({ ctx, input }) => {
          return new TrackAssetInsertion(container.usageRepository).execute({
            organizationId: requireActiveOrganizationId(ctx),
            userId: ctx.session!.user.id,
            assetType: input.assetType,
            externalId: input.externalId,
            client: input.client,
            metadata: input.metadata,
          });
        }),
    }),
  });
}
