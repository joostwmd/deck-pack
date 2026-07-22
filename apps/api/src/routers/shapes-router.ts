import {
  SearchReadyShapes,
  shapeSearchInputSchema,
  shapeSearchResponseSchema,
} from "@deck-pack/gallery";

import type { AppContainer } from "../container";
import { activeOrganizationIdFromSession } from "../trpc/context";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function shapesRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(shapeSearchInputSchema)
      .output(shapeSearchResponseSchema)
      .query(({ ctx, input }) => {
        return new SearchReadyShapes(container.galleryRepository, container.objectStorage).execute({
          ...input,
          organizationId: activeOrganizationIdFromSession(ctx),
        });
      }),
  });
}
