import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type {
  GalleryItemDetail,
  GalleryScope,
  UpdateGalleryItemMetadataInput,
} from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class UpdateGalleryItem {
  constructor(private readonly repo: GalleryRepository) {}

  async execute(
    scope: GalleryScope,
    input: UpdateGalleryItemMetadataInput,
  ): Promise<GalleryItemDetail> {
    const result = await this.repo.updateMetadata(scope, input);
    if (result === "not_found") {
      throw new NotFoundError("Asset not found");
    }
    if (result === "archived") {
      throw new InvalidStateError("Archived assets cannot be edited");
    }
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    return detail;
  }
}
