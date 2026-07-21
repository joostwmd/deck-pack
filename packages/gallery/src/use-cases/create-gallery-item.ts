import { InvalidStateError } from "@deck-pack/errors";

import type { CreateGalleryItemInput, GalleryScope } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export class CreateGalleryItem {
  constructor(private readonly repo: GalleryRepository) {}

  async execute(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }> {
    if (input.assetClass === "flag" && !input.flagCode?.trim()) {
      throw new InvalidStateError("Flag code is required");
    }
    if ((input.assetClass === "shape" || input.assetClass === "slide") && !input.category?.trim()) {
      throw new InvalidStateError("Category is required");
    }
    return this.repo.create(scope, input);
  }
}
