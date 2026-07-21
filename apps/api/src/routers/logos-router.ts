import { z } from "zod";

import { GetLogoDetails, SearchLogos } from "@deck-pack/logos";

import type { AppContainer } from "../container";
import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../domains/assets/schemas";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function logosRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(z.object({ query: assetSearchQuerySchema }))
      .output(assetSearchResponseSchema)
      .query(({ input }) => {
        return new SearchLogos(container.logoIntegration).execute({ query: input.query });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: assetExternalIdSchema }))
      .output(assetDetailsResponseSchema)
      .query(({ input }) => {
        return new GetLogoDetails(container.logoIntegration).execute({
          externalId: input.externalId,
        });
      }),
  });
}
