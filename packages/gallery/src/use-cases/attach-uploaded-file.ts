import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { GalleryItemDetail, GalleryScope, GalleryUploadRole } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";

export async function attachUploadedFile(
  repo: GalleryRepository,
  scope: GalleryScope,
  input: {
    id: string;
    role: GalleryUploadRole;
    key: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  },
): Promise<GalleryItemDetail> {
  const file = await repo.insertFile({
    blobPath: input.key,
    contentType: input.contentType,
    byteSize: input.byteSize,
    checksum: input.checksum,
  });

  const attached = await repo.attachFile({
    libraryItemId: input.id,
    role: input.role,
    fileId: file.id,
  });
  if (attached === "not_found") {
    throw new NotFoundError("Asset not found");
  }
  if (attached === "invalid_role") {
    throw new InvalidStateError("Invalid upload role for this asset class");
  }

  const detail = await repo.get(scope, input.id);
  if (!detail) throw new NotFoundError("Asset not found");
  return detail;
}
