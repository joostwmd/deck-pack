import { TRPCError } from "@trpc/server";

import { PexelsRateLimitError } from "@deck-pack/integrations/pexels";

import { protectedProcedure } from "../../trpc/procedures";

import { photoSearchInputSchema, photoSearchResponseSchema } from "./schemas";
import type { PhotoService } from "./service";

export function createPhotoRoutes(photoService: PhotoService) {
  return {
    search: protectedProcedure
      .input(photoSearchInputSchema)
      .output(photoSearchResponseSchema)
      .query(async ({ input }) => {
        try {
          return await photoService.search(input);
        } catch (error) {
          if (error instanceof PexelsRateLimitError) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: error.message,
            });
          }

          console.error("Photo search error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search photos",
          });
        }
      }),
  };
}
