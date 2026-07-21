import { z } from "zod";

import {
  GetLogoDetails,
  logoDetailsResponseSchema,
  logoExternalIdSchema,
  logoSearchQuerySchema,
  logoSearchResponseSchema,
  SearchLogos,
} from "@deck-pack/logos";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function logosRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(z.object({ query: logoSearchQuerySchema }))
      .output(logoSearchResponseSchema)
      .query(({ input }) => {
        return new SearchLogos(container.logoIntegration).execute({ query: input.query });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: logoExternalIdSchema }))
      .output(logoDetailsResponseSchema)
      .query(({ input }) => {
        return new GetLogoDetails(container.logoIntegration).execute({
          externalId: input.externalId,
        });
      }),
  });
}
