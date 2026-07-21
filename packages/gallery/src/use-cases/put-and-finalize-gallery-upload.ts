import { InvalidStateError, NotFoundError } from "@deck-pack/errors";
import type { ObjectStorage } from "@deck-pack/storage";

import type { GalleryItemDetail, GalleryScope, GalleryUploadRole } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { attachUploadedFile } from "./attach-uploaded-file";

export class PutAndFinalizeGalleryUpload {
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
      dataBase64: string;
    },
  ): Promise<GalleryItemDetail> {
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    if (detail.status === "archived") {
      throw new InvalidStateError("Archived assets cannot accept uploads");
    }

    const body = Uint8Array.from(Buffer.from(input.dataBase64, "base64"));
    const putResult = await this.storage.put({
      key: input.key,
      contentType: input.contentType,
      body,
    });

    return attachUploadedFile(this.repo, scope, {
      id: input.id,
      role: input.role,
      key: input.key,
      contentType: input.contentType,
      byteSize: putResult.byteSize ?? body.byteLength,
      checksum: putResult.etag,
    });
  }
}
