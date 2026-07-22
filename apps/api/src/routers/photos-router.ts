import { SearchPhotos } from "@deck-pack/photos";
import { photoSearchInputSchema, photoSearchResponseSchema } from "@deck-pack/photos/schemas";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function photosRouter(container: AppContainer) {
  return router({
    search: protectedProcedure
      .input(photoSearchInputSchema)
      .output(photoSearchResponseSchema)
      .query(({ input }) => {
        return new SearchPhotos(container.photoIntegration).execute(input);
      }),
  });
}
