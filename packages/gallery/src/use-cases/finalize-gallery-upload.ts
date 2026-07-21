import { InvalidStateError, NotFoundError } from "@deck-pack/errors";
import type { ObjectStorage } from "@deck-pack/storage";

import type { GalleryItemDetail, GalleryScope, GalleryUploadRole } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { attachUploadedFile } from "./attach-uploaded-file";

export class FinalizeGalleryUpload {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    scope: GalleryScope,
    input: {
      id: string;
      role: GalleryUploadRole;
      key: string;
      contentType: string;
    },
  ): Promise<GalleryItemDetail> {
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    if (detail.status === "archived") {
      throw new InvalidStateError("Archived assets cannot accept uploads");
    }

    const head = await this.storage.head(input.key);
    if (!head) {
      throw new InvalidStateError("Upload not found in storage");
    }

    return attachUploadedFile(this.repo, scope, {
      id: input.id,
      role: input.role,
      key: input.key,
      contentType: input.contentType || head.contentType || "application/octet-stream",
      byteSize: head.byteSize ?? 0,
      checksum: head.etag,
    });
  }
}
