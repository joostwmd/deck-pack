import { NotFoundError } from "@deck-pack/errors";

import type { GalleryItemDetail, GalleryScope } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class GetGalleryItem {
  constructor(private readonly repo: GalleryRepository) {}

  async execute(scope: GalleryScope, input: { id: string }): Promise<GalleryItemDetail> {
    const row = await this.repo.get(scope, input.id);
    if (!row) throw new NotFoundError("Asset not found");
    return row;
  }
}
