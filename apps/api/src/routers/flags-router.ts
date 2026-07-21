import { z } from "zod";

import {
  flagDetailsResponseSchema,
  flagExternalIdSchema,
  flagSearchQuerySchema,
  flagSearchResponseSchema,
  GetReadyFlagDetails,
  SearchReadyFlags,
} from "@deck-pack/gallery";

import type { AppContainer } from "../container";
import { activeOrganizationIdFromSession } from "../trpc/context";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function flagsRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(
        z.object({
          query: flagSearchQuerySchema,
          internalOnly: z.boolean().optional(),
        }),
      )
      .output(flagSearchResponseSchema)
      .query(({ ctx, input }) => {
        return new SearchReadyFlags(container.galleryRepository, container.objectStorage).execute({
          query: input.query,
          organizationId: activeOrganizationIdFromSession(ctx),
          internalOnly: input.internalOnly,
        });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: flagExternalIdSchema }))
      .output(flagDetailsResponseSchema)
      .query(({ ctx, input }) => {
        return new GetReadyFlagDetails(
          container.galleryRepository,
          container.objectStorage,
        ).execute({
          id: input.externalId,
          organizationId: activeOrganizationIdFromSession(ctx),
        });
      }),
  });
}
