import type { ObjectStorage } from "@deck-pack/storage";

import type { DiscoveryAssetSearchResponse, SearchReadyFlagsInput } from "../domain/discovery";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { createDiscoveryDownloadUrl } from "../signed-urls";
import {
  mapFlagSearchResponse,
  type FlagSearchResultWithUrl,
} from "../mappers/flag-discovery-mappers";

export class SearchReadyFlags {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: SearchReadyFlagsInput): Promise<DiscoveryAssetSearchResponse> {
    const rows = await this.repo.searchReadyFlags(input);
    const withUrls: FlagSearchResultWithUrl[] = [];

    for (const row of rows) {
      const previewUrl = await createDiscoveryDownloadUrl(this.storage, row.previewBlobPath);
      if (!previewUrl) continue;
      withUrls.push({
        id: row.id,
        name: row.displayName,
        code: row.code,
        previewUrl,
        scope: row.scope,
      });
    }

    return mapFlagSearchResponse(withUrls);
  }
}
