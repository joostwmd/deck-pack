import type { ObjectStorage } from "@deck-pack/storage";

import type {
  SearchReadyShapesInput,
  ShapeSearchResponse,
  ShapeSearchResult,
} from "../domain/discovery";
import { SHAPE_CATEGORIES } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { createDiscoveryDownloadUrl } from "../signed-urls";

export class SearchReadyShapes {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: SearchReadyShapesInput): Promise<ShapeSearchResponse> {
    const rows = await this.repo.searchReadyShapes(input);

    const mapped: ShapeSearchResult[] = [];
    for (const row of rows) {
      const svgUrl = await createDiscoveryDownloadUrl(this.storage, row.svgBlobPath);
      if (!svgUrl) continue;
      mapped.push({
        id: row.id,
        name: row.displayName,
        category: row.category,
        scope: row.scope,
        thumbnailUrl: svgUrl,
        svgUrl,
        createdAt: row.createdAt.toISOString(),
      });
    }

    const categoriesInResults = new Set(mapped.map((row) => row.category));
    return {
      results: mapped,
      total: mapped.length,
      facets: {
        categories: SHAPE_CATEGORIES.filter((category) => categoriesInResults.has(category)),
      },
    };
  }
}
