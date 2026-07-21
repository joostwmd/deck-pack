import {
  attachFileToGalleryItem,
  createGlobalGalleryItem,
  createOrgGalleryItem,
  getGlobalGalleryItem,
  getOrgGalleryItem,
  insertGalleryFile,
  listGlobalGalleryItems,
  listOrgGalleryItems,
  setGlobalGalleryItemStatus,
  setOrgGalleryItemStatus,
  updateGlobalGalleryItemMetadata,
  updateOrgGalleryItemMetadata,
} from "@deck-pack/db/queries/galleryAdmin";
import {
  getReadyFlagDetails,
  listAllReadySlides,
  searchReadyFlags,
  searchReadyShapes,
  searchReadySlides,
} from "@deck-pack/db/queries/galleryDiscovery";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type {
  GetReadyFlagDetailsInput,
  ReadyFlagDetailsRow,
  ReadyFlagSearchRow,
  ReadyShapeRow,
  ReadySlideRow,
  SearchReadyFlagsInput,
  SearchReadyShapesInput,
  SearchReadySlidesInput,
} from "../domain/discovery";
import type {
  CreateGalleryItemInput,
  GalleryAssetClass,
  GalleryItemDetail,
  GalleryItemStatus,
  GalleryListItem,
  GalleryScope,
  GalleryUploadRole,
  UpdateGalleryItemMetadataInput,
} from "../domain/gallery-item";

export interface GalleryRepository {
  list(
    scope: GalleryScope,
    input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
  ): Promise<GalleryListItem[]>;
  get(scope: GalleryScope, id: string): Promise<GalleryItemDetail | null>;
  create(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }>;
  updateMetadata(
    scope: GalleryScope,
    input: UpdateGalleryItemMetadataInput,
  ): Promise<"ok" | "not_found" | "archived">;
  setStatus(scope: GalleryScope, id: string, status: GalleryItemStatus): Promise<void>;
  insertFile(input: {
    blobPath: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  }): Promise<{ id: string }>;
  attachFile(input: {
    galleryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role">;

  searchReadyFlags(input: SearchReadyFlagsInput): Promise<ReadyFlagSearchRow[]>;
  getReadyFlagDetails(input: GetReadyFlagDetailsInput): Promise<ReadyFlagDetailsRow | null>;
  searchReadyShapes(input: SearchReadyShapesInput): Promise<ReadyShapeRow[]>;
  searchReadySlides(input: SearchReadySlidesInput): Promise<ReadySlideRow[]>;
  listAllReadySlides(input: { organizationId?: string | null }): Promise<ReadySlideRow[]>;
}

export class DrizzleGalleryRepository implements GalleryRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async list(
    scope: GalleryScope,
    input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
  ): Promise<GalleryListItem[]> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return listGlobalGalleryItems({
        tx,
        assetClass: input.assetClass,
        includeArchived: input.includeArchived,
      });
    }
    return listOrgGalleryItems({
      tx,
      organizationId: scope.organizationId,
      assetClass: input.assetClass,
      includeArchived: input.includeArchived,
    });
  }

  async get(scope: GalleryScope, id: string): Promise<GalleryItemDetail | null> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return getGlobalGalleryItem({ tx, id });
    }
    return getOrgGalleryItem({ tx, id, organizationId: scope.organizationId });
  }

  async create(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return createGlobalGalleryItem({ tx, input });
    }
    return createOrgGalleryItem({
      tx,
      input: { ...input, organizationId: scope.organizationId },
    });
  }

  async updateMetadata(
    scope: GalleryScope,
    input: UpdateGalleryItemMetadataInput,
  ): Promise<"ok" | "not_found" | "archived"> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return updateGlobalGalleryItemMetadata({ tx, ...input });
    }
    return updateOrgGalleryItemMetadata({
      tx,
      organizationId: scope.organizationId,
      ...input,
    });
  }

  async setStatus(scope: GalleryScope, id: string, status: GalleryItemStatus): Promise<void> {
    const tx = this.tx();
    if (scope.kind === "global") {
      await setGlobalGalleryItemStatus({ tx, id, status });
      return;
    }
    await setOrgGalleryItemStatus({
      tx,
      id,
      organizationId: scope.organizationId,
      status,
    });
  }

  async insertFile(input: {
    blobPath: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  }): Promise<{ id: string }> {
    return insertGalleryFile({ tx: this.tx(), ...input });
  }

  async attachFile(input: {
    galleryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role"> {
    return attachFileToGalleryItem({
      tx: this.tx(),
      galleryItemId: input.galleryItemId,
      role: input.role,
      fileId: input.fileId,
    });
  }

  async searchReadyFlags(input: SearchReadyFlagsInput): Promise<ReadyFlagSearchRow[]> {
    return searchReadyFlags({
      tx: this.tx(),
      query: input.query,
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    });
  }

  async getReadyFlagDetails(input: GetReadyFlagDetailsInput): Promise<ReadyFlagDetailsRow | null> {
    return getReadyFlagDetails({
      tx: this.tx(),
      id: input.id,
      organizationId: input.organizationId,
    });
  }

  async searchReadyShapes(input: SearchReadyShapesInput): Promise<ReadyShapeRow[]> {
    return searchReadyShapes({
      tx: this.tx(),
      category: input.category,
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    });
  }

  async searchReadySlides(input: SearchReadySlidesInput): Promise<ReadySlideRow[]> {
    return searchReadySlides({
      tx: this.tx(),
      query: input.query,
      category: input.category,
      tags: input.tags,
      aspectRatio: input.aspectRatio,
      sort: input.sort,
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    });
  }

  async listAllReadySlides(input: { organizationId?: string | null }): Promise<ReadySlideRow[]> {
    return listAllReadySlides({
      tx: this.tx(),
      organizationId: input.organizationId,
    });
  }
}
