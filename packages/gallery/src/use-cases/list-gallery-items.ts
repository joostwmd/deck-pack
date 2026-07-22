import type { ObjectStorage } from "@deck-pack/storage";

import type {
  GalleryAssetClass,
  GalleryListItemWithPreview,
  GalleryScope,
} from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class ListGalleryItems {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    scope: GalleryScope,
    input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
  ): Promise<GalleryListItemWithPreview[]> {
    const rows = await this.repo.list(scope, input);

    return Promise.all(
      rows.map(async (row) => {
        const base = {
          id: row.id,
          assetClass: row.assetClass,
          status: row.status,
          displayName: row.displayName,
          updatedAt: row.updatedAt,
          createdAt: row.createdAt,
          category: row.category,
          code: row.code,
          aspectRatio: row.aspectRatio,
          previewContentType: row.previewContentType,
        };

        if (!row.previewBlobPath) {
          return { ...base, previewUrl: null };
        }

        try {
          const download = await this.storage.createDownloadUrl({
            key: row.previewBlobPath,
            expiresInSeconds: 15 * 60,
          });
          return { ...base, previewUrl: download.url };
        } catch {
          return { ...base, previewUrl: null };
        }
      }),
    );
  }
}
