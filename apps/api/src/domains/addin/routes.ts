import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";

import { protectedProcedure } from "../../api/procedures";

import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
  trackAssetInsertionInputSchema,
  trackAssetInsertionOutputSchema,
} from "./schemas";
import type { AddinAssetService } from "./service";

export function createAddinRoutes(addinAssetService: AddinAssetService) {
  return {
    logos: {
      search: protectedProcedure
        .input(z.object({ query: assetSearchQuerySchema }))
        .output(assetSearchResponseSchema)
        .query(async ({ input }) => {
          try {
            return await addinAssetService.searchLogos(input.query);
          } catch (error) {
            console.error("Logo search error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to search logos",
            });
          }
        }),

      getDetails: protectedProcedure
        .input(z.object({ externalId: assetExternalIdSchema }))
        .output(assetDetailsResponseSchema)
        .query(async ({ input }) => {
          try {
            return await addinAssetService.getLogoDetails(input.externalId);
          } catch (error) {
            console.error("Logo details error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get logo details",
            });
          }
        }),
    },

    flags: {
      search: protectedProcedure
        .input(z.object({ query: assetSearchQuerySchema }))
        .output(assetSearchResponseSchema)
        .query(async ({ input }) => {
          try {
            return await addinAssetService.searchFlags(input.query);
          } catch (error) {
            console.error("Flag search error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to search flags",
            });
          }
        }),

      getDetails: protectedProcedure
        .input(z.object({ externalId: assetExternalIdSchema }))
        .output(assetDetailsResponseSchema)
        .query(async ({ input }) => {
          try {
            const flag = await addinAssetService.getFlagDetails(input.externalId);

            if (!flag) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Flag not found",
              });
            }

            return flag;
          } catch (error) {
            if (error instanceof TRPCError) {
              throw error;
            }

            console.error("Flag details error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get flag details",
            });
          }
        }),
    },

    icons: {
      search: protectedProcedure
        .input(z.object({ query: assetSearchQuerySchema }))
        .output(assetSearchResponseSchema)
        .query(async ({ input }) => {
          try {
            return await addinAssetService.searchIcons(input.query);
          } catch (error) {
            console.error("Icon search error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to search icons",
            });
          }
        }),

      getDetails: protectedProcedure
        .input(z.object({ externalId: assetExternalIdSchema }))
        .output(assetDetailsResponseSchema)
        .query(async ({ input }) => {
          try {
            return await addinAssetService.getIconDetails(input.externalId);
          } catch (error) {
            console.error("Icon details error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get icon details",
            });
          }
        }),
    },

    insertions: {
      track: protectedProcedure
        .input(trackAssetInsertionInputSchema)
        .output(trackAssetInsertionOutputSchema)
        .mutation(async ({ ctx, input }) => {
          const row = await insertAssetInsertion({
            tx: ctx.tx,
            input: {
              userId: ctx.session!.user.id,
              assetType: input.assetType,
              externalId: input.externalId,
              client: input.client,
              metadata: input.metadata,
            },
          });

          if (!row) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to track asset insertion",
            });
          }

          return { id: row.id };
        }),
    },
  };
}
