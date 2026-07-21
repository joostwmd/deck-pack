import { z } from "zod";

import { GetIconDetails, SearchIcons } from "@deck-pack/icons";

import type { AppContainer } from "../container";
import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../domains/assets/schemas";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function iconsRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(z.object({ query: assetSearchQuerySchema }))
      .output(assetSearchResponseSchema)
      .query(({ input }) => {
        return new SearchIcons(container.iconIntegration).execute({ query: input.query });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: assetExternalIdSchema }))
      .output(assetDetailsResponseSchema)
      .query(({ input }) => {
        return new GetIconDetails(container.iconIntegration).execute({
          externalId: input.externalId,
        });
      }),
  });
}
