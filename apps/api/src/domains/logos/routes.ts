import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../assets/schemas";
import { protectedProcedure } from "../../trpc/procedures";

import type { LogoService } from "./service";

export function createLogoRoutes(logoService: LogoService) {
  return {
    search: protectedProcedure
      .input(z.object({ query: assetSearchQuerySchema }))
      .output(assetSearchResponseSchema)
      .query(async ({ input }) => {
        try {
          return await logoService.search(input.query);
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
          return await logoService.getDetails(input.externalId);
        } catch (error) {
          console.error("Logo details error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get logo details",
          });
        }
      }),
  };
}
