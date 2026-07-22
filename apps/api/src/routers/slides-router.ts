import {
  SearchReadySlides,
  slideSearchInputSchema,
  slideSearchResponseSchema,
} from "@deck-pack/gallery";

import type { AppContainer } from "../container";
import { activeOrganizationIdFromSession } from "../trpc/context";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function slidesRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(slideSearchInputSchema)
      .output(slideSearchResponseSchema)
      .query(({ ctx, input }) => {
        return new SearchReadySlides(container.galleryRepository, container.objectStorage).execute({
          ...input,
          organizationId: activeOrganizationIdFromSession(ctx),
        });
      }),
  });
}
