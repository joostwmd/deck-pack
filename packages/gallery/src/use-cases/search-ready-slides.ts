import type { ObjectStorage } from "@deck-pack/storage";

import type {
  SearchReadySlidesInput,
  SlideSearchResponse,
  SlideSearchResult,
} from "../domain/discovery";
import type { SlideAspectRatio, SlideCategory } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { createDiscoveryDownloadUrl } from "../signed-urls";

function buildFacets(
  slides: Array<{ category: SlideCategory; aliases: string[]; aspectRatio: SlideAspectRatio }>,
): SlideSearchResponse["facets"] {
  const categories = [...new Set(slides.map((slide) => slide.category))].sort();
  const tags = [...new Set(slides.flatMap((slide) => slide.aliases))].sort();
  const aspectRatios = [...new Set(slides.map((slide) => slide.aspectRatio))].sort();
  return { categories, tags, aspectRatios };
}

export class SearchReadySlides {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: SearchReadySlidesInput): Promise<SlideSearchResponse> {
    const discoveryScope = {
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    };
    const [filteredRows, allRows] = await Promise.all([
      this.repo.searchReadySlides({
        query: input.query,
        category: input.category,
        tags: input.tags,
        aspectRatio: input.aspectRatio,
        sort: input.sort,
        ...discoveryScope,
      }),
      this.repo.listAllReadySlides({ organizationId: input.organizationId }),
    ]);

    const results: SlideSearchResult[] = [];
    for (const row of filteredRows) {
      const [thumbnailUrl, presentationUrl] = await Promise.all([
        createDiscoveryDownloadUrl(this.storage, row.thumbnailBlobPath),
        createDiscoveryDownloadUrl(this.storage, row.presentationBlobPath),
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
        scope: row.scope,
        createdAt: row.createdAt.toISOString(),
      });
    }

    return {
      results,
      total: results.length,
      facets: buildFacets(allRows),
    };
  }
}
