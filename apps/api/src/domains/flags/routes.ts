import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  assetDetailsResponseSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetSearchResponseSchema,
} from "../assets/schemas";
import { protectedProcedure } from "../../api/procedures";

import type { FlagService } from "./service";

export function createFlagRoutes(flagService: FlagService) {
  return {
    search: protectedProcedure
      .input(z.object({ query: assetSearchQuerySchema }))
      .output(assetSearchResponseSchema)
      .query(async ({ input }) => {
        try {
          return await flagService.search(input.query);
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
          const flag = await flagService.getDetails(input.externalId);

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
  };
}
