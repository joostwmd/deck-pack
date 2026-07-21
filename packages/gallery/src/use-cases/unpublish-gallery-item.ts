import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { GalleryItemDetail, GalleryScope } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class UnpublishGalleryItem {
  constructor(private readonly repo: GalleryRepository) {}

  async execute(scope: GalleryScope, input: { id: string }): Promise<GalleryItemDetail> {
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    if (detail.status !== "ready") {
      throw new InvalidStateError("Only published assets can be unpublished");
    }
    await this.repo.setStatus(scope, input.id, "pending");
    const updated = await this.repo.get(scope, input.id);
    if (!updated) throw new NotFoundError("Asset not found");
    return updated;
  }
}
