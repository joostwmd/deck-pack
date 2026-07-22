import type { ObjectStorage } from "@deck-pack/storage";

import type { DiscoveryAssetDetailsResponse, GetReadyFlagDetailsInput } from "../domain/discovery";
import { FlagNotFoundError } from "../domain/errors";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { createDiscoveryDownloadUrl } from "../signed-urls";
import {
  mapFlagDetailsResponse,
  type FlagDetailsWithUrls,
} from "../mappers/flag-discovery-mappers";

export class GetReadyFlagDetails {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: GetReadyFlagDetailsInput): Promise<DiscoveryAssetDetailsResponse> {
    const flag = await this.repo.getReadyFlagDetails(input);
    if (!flag) {
      throw new FlagNotFoundError(input.id);
    }

    const variants: FlagDetailsWithUrls["variants"] = [];
    for (const variant of flag.variants) {
      const url = await createDiscoveryDownloadUrl(this.storage, variant.blobPath);
      if (!url) {
        throw new FlagNotFoundError(input.id);
      }
      variants.push({
        type: variant.role,
        url,
        width: 0,
        height: 0,
      });
    }

    return mapFlagDetailsResponse({
      id: flag.id,
      name: flag.displayName,
      code: flag.code,
      variants,
    });
  }
}
