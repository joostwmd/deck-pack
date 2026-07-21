import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../assets/schemas";
import { protectedProcedure } from "../../trpc/procedures";

import type { IconService } from "./service";

export function createIconRoutes(iconService: IconService) {
  return {
    search: protectedProcedure
      .input(z.object({ query: assetSearchQuerySchema }))
      .output(assetSearchResponseSchema)
      .query(async ({ input }) => {
        try {
          return await iconService.search(input.query);
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
          return await iconService.getDetails(input.externalId);
        } catch (error) {
          console.error("Icon details error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get icon details",
          });
        }
      }),
  };
}
