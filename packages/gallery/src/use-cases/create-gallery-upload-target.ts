import { InvalidStateError, NotFoundError } from "@deck-pack/errors";
import { buildGalleryObjectKey, type ObjectStorage } from "@deck-pack/storage";

import type { GalleryScope, GalleryUploadRole } from "../domain/gallery-item";
import type { GalleryRepository } from "../repositories/gallery-repository";
import { extensionFor, toBlobRole } from "../upload-roles";
import { uploadTargetForClient } from "../upload-target-for-client";

export class CreateGalleryUploadTarget {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    scope: GalleryScope,
    input: {
      id: string;
      role: GalleryUploadRole;
      contentType: string;
      byteSize: number;
    },
  ) {
    const detail = await this.repo.get(scope, input.id);
    if (!detail) throw new NotFoundError("Asset not found");
    if (detail.status === "archived") {
      throw new InvalidStateError("Archived assets cannot accept uploads");
    }

    const key = buildGalleryObjectKey(
      scope.kind === "global"
        ? {
            scope: "global",
            assetClass: detail.assetClass,
            galleryItemId: detail.id,
            role: toBlobRole(input.role),
            extension: extensionFor(input.role, input.contentType),
          }
        : {
            scope: "org",
            organizationId: scope.organizationId,
            assetClass: detail.assetClass,
            galleryItemId: detail.id,
            role: toBlobRole(input.role),
            extension: extensionFor(input.role, input.contentType),
          },
    );

    const target = await this.storage.createUploadTarget({
      key,
      contentType: input.contentType,
      byteSize: input.byteSize,
      expiresInSeconds: 15 * 60,
    });

    return uploadTargetForClient(target);
  }
}
