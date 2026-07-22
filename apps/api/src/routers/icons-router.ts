import { z } from "zod";

import {
  GetIconDetails,
  iconDetailsResponseSchema,
  iconExternalIdSchema,
  iconSearchQuerySchema,
  iconSearchResponseSchema,
  SearchIcons,
} from "@deck-pack/icons";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function iconsRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(z.object({ query: iconSearchQuerySchema }))
      .output(iconSearchResponseSchema)
      .query(({ input }) => {
        return new SearchIcons(container.iconIntegration).execute({ query: input.query });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: iconExternalIdSchema }))
      .output(iconDetailsResponseSchema)
      .query(({ input }) => {
        return new GetIconDetails(container.iconIntegration).execute({
          externalId: input.externalId,
        });
      }),
  });
}
