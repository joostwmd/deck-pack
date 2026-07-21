import { z } from "zod";

import { GetReadyFlagDetails, SearchReadyFlags } from "@deck-pack/gallery";

import type { AppContainer } from "../container";
import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../domains/assets/schemas";
import { activeOrganizationIdFromSession } from "../trpc/context";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function flagsRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(
        z.object({
          query: assetSearchQuerySchema,
          internalOnly: z.boolean().optional(),
        }),
      )
      .output(assetSearchResponseSchema)
      .query(({ ctx, input }) => {
        return new SearchReadyFlags(container.galleryRepository, container.objectStorage).execute({
          query: input.query,
          organizationId: activeOrganizationIdFromSession(ctx),
          internalOnly: input.internalOnly,
        });
      }),

    getDetails: protectedProcedure
      .input(z.object({ externalId: assetExternalIdSchema }))
      .output(assetDetailsResponseSchema)
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
