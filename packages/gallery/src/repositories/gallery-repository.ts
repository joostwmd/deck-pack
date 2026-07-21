import {
  attachFileToLibraryItem,
  createGlobalLibraryItem,
  createOrgLibraryItem,
  getGlobalLibraryItem,
  getOrgLibraryItem,
  insertLibraryFile,
  listGlobalLibraryItems,
  listOrgLibraryItems,
  setGlobalLibraryItemStatus,
  setOrgLibraryItemStatus,
  updateGlobalLibraryItemMetadata,
  updateOrgLibraryItemMetadata,
} from "@deck-pack/db/queries/libraryAdmin";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

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
    libraryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role">;
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
      return listGlobalLibraryItems({
        tx,
        assetClass: input.assetClass,
        includeArchived: input.includeArchived,
      });
    }
    return listOrgLibraryItems({
      tx,
      organizationId: scope.organizationId,
      assetClass: input.assetClass,
      includeArchived: input.includeArchived,
    });
  }

  async get(scope: GalleryScope, id: string): Promise<GalleryItemDetail | null> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return getGlobalLibraryItem({ tx, id });
    }
    return getOrgLibraryItem({ tx, id, organizationId: scope.organizationId });
  }

  async create(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }> {
    const tx = this.tx();
    if (scope.kind === "global") {
      return createGlobalLibraryItem({ tx, input });
    }
    return createOrgLibraryItem({
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
      return updateGlobalLibraryItemMetadata({ tx, ...input });
    }
    return updateOrgLibraryItemMetadata({
      tx,
      organizationId: scope.organizationId,
      ...input,
    });
  }

  async setStatus(scope: GalleryScope, id: string, status: GalleryItemStatus): Promise<void> {
    const tx = this.tx();
    if (scope.kind === "global") {
      await setGlobalLibraryItemStatus({ tx, id, status });
      return;
    }
    await setOrgLibraryItemStatus({
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
    return insertLibraryFile({ tx: this.tx(), ...input });
  }

  async attachFile(input: {
    libraryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role"> {
    return attachFileToLibraryItem({
      tx: this.tx(),
      libraryItemId: input.libraryItemId,
      role: input.role,
      fileId: input.fileId,
    });
  }
}
