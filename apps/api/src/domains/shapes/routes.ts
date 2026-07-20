import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "../../api/procedures";
import { discoveryOrganizationId } from "../../api/discovery-context";

import { shapeSearchInputSchema, shapeSearchResponseSchema } from "./schemas";
import type { ShapeService } from "./service";

export function createShapeRoutes(shapeService: ShapeService) {
  return {
    search: protectedProcedure
      .input(shapeSearchInputSchema)
      .output(shapeSearchResponseSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await shapeService.search(ctx.tx, {
            ...input,
            organizationId: discoveryOrganizationId(ctx),
          });
        } catch (error) {
          console.error("Shape search error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search shapes",
          });
        }
      }),
  };
}
