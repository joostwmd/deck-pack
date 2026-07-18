import { protectedProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import { trackAssetInsertionInputSchema, trackAssetInsertionOutputSchema } from "./schemas";
import type { AddinService } from "./service";

export function createAddinRoutes(addinService: AddinService) {
  return {
    insertions: {
      track: protectedProcedure
        .input(trackAssetInsertionInputSchema)
        .output(trackAssetInsertionOutputSchema)
        .mutation(async ({ ctx, input }) => {
          return unwrapServiceResult(
            await addinService.trackInsertion(ctx.tx, {
              userId: ctx.session!.user.id,
              assetType: input.assetType,
              externalId: input.externalId,
              client: input.client,
              metadata: input.metadata,
            }),
          );
        }),
    },
  };
}
