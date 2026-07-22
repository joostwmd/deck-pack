import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import {
  checkPublishable,
  type GalleryItemDetail,
  type GalleryScope,
} from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class PublishGalleryItem {
  constructor(private readonly repo: GalleryRepository) {}

  async execute(scope: GalleryScope, input: { id: string }): Promise<GalleryItemDetail> {
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    if (detail.status === "archived") {
      throw new InvalidStateError("Restore from archive is not supported");
    }
    const check = checkPublishable(detail);
    if (!check.ok) {
      throw new InvalidStateError(`Missing required files/fields: ${check.missing.join(", ")}`);
    }
    await this.repo.setStatus(scope, input.id, "ready");
    const updated = await this.repo.get(scope, input.id);
    if (!updated) throw new NotFoundError("Asset not found");
    return updated;
  }
}
