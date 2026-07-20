import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "../../api/procedures";

import { slideSearchInputSchema, slideSearchResponseSchema } from "./schemas";
import type { SlideService } from "./service";

export function createSlideRoutes(slideService: SlideService) {
  return {
    search: protectedProcedure
      .input(slideSearchInputSchema)
      .output(slideSearchResponseSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await slideService.search(ctx.tx, input);
        } catch (error) {
          console.error("Slide search error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search slides",
          });
        }
      }),
  };
}
