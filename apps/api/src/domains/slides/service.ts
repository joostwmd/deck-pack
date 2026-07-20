import {
  listAllReadySlides,
  searchReadySlides,
} from "@deck-pack/db/queries/libraryDiscovery";
import type { SlideAspectRatio, SlideCategory } from "@deck-pack/db/schema/library-assets";
import type { Transaction } from "@deck-pack/db/transaction";
import type { ObjectStorage } from "@deck-pack/storage";
import type { z } from "zod";

import { createDiscoveryDownloadUrl } from "../library/signed-urls";

import type { slideSearchInputSchema, slideSearchResponseSchema } from "./schemas";

export type SlideServiceDeps = {
  storage: ObjectStorage;
};

function buildFacets(
  slides: Array<{ category: SlideCategory; aliases: string[]; aspectRatio: SlideAspectRatio }>,
): z.infer<typeof slideSearchResponseSchema>["facets"] {
  const categories = [...new Set(slides.map((slide) => slide.category))].sort();
  const tags = [...new Set(slides.flatMap((slide) => slide.aliases))].sort();
  const aspectRatios = [...new Set(slides.map((slide) => slide.aspectRatio))].sort();
  return { categories, tags, aspectRatios };
}

export function createSlideService(deps: SlideServiceDeps) {
  return {
    search: async (
      tx: Transaction,
      input: z.infer<typeof slideSearchInputSchema>,
    ): Promise<z.infer<typeof slideSearchResponseSchema>> => {
      const [filteredRows, allRows] = await Promise.all([
        searchReadySlides({
          tx,
          query: input.query,
          category: input.category,
          tags: input.tags,
          aspectRatio: input.aspectRatio,
          sort: input.sort,
        }),
        listAllReadySlides({ tx }),
      ]);

      const results: z.infer<typeof slideSearchResponseSchema>["results"] = [];
      for (const row of filteredRows) {
        const [thumbnailUrl, presentationUrl] = await Promise.all([
          createDiscoveryDownloadUrl(deps.storage, row.thumbnailBlobPath),
          createDiscoveryDownloadUrl(deps.storage, row.presentationBlobPath),
        ]);
        if (!thumbnailUrl || !presentationUrl) continue;

        results.push({
          id: row.id,
          name: row.displayName,
          thumbnailUrl,
          presentationUrl,
          category: row.category,
          tags: row.aliases,
          aspectRatio: row.aspectRatio,
          createdAt: row.createdAt.toISOString(),
        });
      }

      return {
        results,
        total: results.length,
        facets: buildFacets(allRows),
      };
    },
  };
}

export type SlideService = ReturnType<typeof createSlideService>;
