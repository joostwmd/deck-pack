import type { Transaction } from "@deck-pack/db/transaction";
import type {
  CreateGlobalLibraryItemInput,
  LibraryItemDetail,
} from "@deck-pack/db/queries/libraryAdmin";
import {
  attachFileToLibraryItem,
  createGlobalLibraryItem,
  getGlobalLibraryItem,
  insertLibraryFile,
  isLibraryItemPublishable,
  listGlobalLibraryItems,
  setGlobalLibraryItemStatus,
  updateGlobalLibraryItemMetadata,
} from "@deck-pack/db/queries/libraryAdmin";
import type {
  LibraryAssetClass,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
} from "@deck-pack/db/schema/library-assets";
import {
  buildLibraryObjectKey,
  type LibraryBlobRole,
  type ObjectStorage,
} from "@deck-pack/storage";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { z } from "zod";

import type { libraryUploadRoleSchema } from "./schemas";

type UploadRole = z.infer<typeof libraryUploadRoleSchema>;

function extensionFor(role: UploadRole, contentType: string): string {
  if (role === "svg" || contentType.includes("svg")) return "svg";
  if (role === "presentation") return "pptx";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "bin";
}

function toBlobRole(role: UploadRole): LibraryBlobRole {
  if (role === "rectangle" || role === "square" || role === "circle") {
    return `variant_${role}`;
  }
  return role;
}

async function requireGlobalLibraryItem(
  tx: Transaction,
  id: string,
): Promise<ServiceResult<LibraryItemDetail>> {
  const detail = await getGlobalLibraryItem({ tx, id });
  if (!detail) return serviceFail("not_found", { message: "Asset not found" });
  return serviceOk(detail);
}

export type LibraryServiceDeps = {
  storage: ObjectStorage;
};

export function createLibraryService(deps: LibraryServiceDeps) {
  return {
    list: async (
      tx: Transaction,
      input: { assetClass: LibraryAssetClass; includeArchived?: boolean },
    ) => {
      const rows = await listGlobalLibraryItems({
        tx,
        assetClass: input.assetClass,
        includeArchived: input.includeArchived,
      });

      const withPreviews = await Promise.all(
        rows.map(async (row) => {
          const base = {
            id: row.id,
            assetClass: row.assetClass,
            status: row.status,
            displayName: row.displayName,
            updatedAt: row.updatedAt,
            createdAt: row.createdAt,
            category: row.category,
            code: row.code,
            aspectRatio: row.aspectRatio,
            previewContentType: row.previewContentType,
          };

          if (!row.previewBlobPath) {
            return { ...base, previewUrl: null };
          }

          try {
            const download = await deps.storage.createDownloadUrl({
              key: row.previewBlobPath,
              expiresInSeconds: 15 * 60,
            });
            return { ...base, previewUrl: download.url };
          } catch {
            return { ...base, previewUrl: null };
          }
        }),
      );

      return serviceOk(withPreviews);
    },

    get: async (
      tx: Transaction,
      input: { id: string },
    ): Promise<ServiceResult<LibraryItemDetail>> => {
      const row = await getGlobalLibraryItem({ tx, id: input.id });
      if (!row) return serviceFail("not_found", { message: "Asset not found" });
      return serviceOk(row);
    },

    create: async (
      tx: Transaction,
      input: CreateGlobalLibraryItemInput,
    ): Promise<ServiceResult<{ id: string }>> => {
      if (input.assetClass === "flag" && !input.flagCode?.trim()) {
        return serviceFail("invalid_state", { message: "Flag code is required" });
      }
      if (
        (input.assetClass === "shape" || input.assetClass === "slide") &&
        !input.category?.trim()
      ) {
        return serviceFail("invalid_state", { message: "Category is required" });
      }
      const created = await createGlobalLibraryItem({ tx, input });
      return serviceOk(created);
    },

    update: async (
      tx: Transaction,
      input: {
        id: string;
        displayName: string;
        aliases: string[];
        flagCode?: string;
        category?: ShapeCategory | SlideCategory;
        aspectRatio?: SlideAspectRatio;
      },
    ) => {
      const result = await updateGlobalLibraryItemMetadata({ tx, ...input });
      if (result === "not_found") {
        return serviceFail("not_found", { message: "Asset not found" });
      }
      if (result === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot be edited" });
      }
      return requireGlobalLibraryItem(tx, input.id);
    },

    publish: async (tx: Transaction, input: { id: string }) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Restore from archive is not supported" });
      }
      const check = isLibraryItemPublishable(detail);
      if (!check.ok) {
        return serviceFail("invalid_state", {
          message: `Missing required files/fields: ${check.missing.join(", ")}`,
        });
      }
      await setGlobalLibraryItemStatus({ tx, id: input.id, status: "ready" });
      return requireGlobalLibraryItem(tx, input.id);
    },

    unpublish: async (tx: Transaction, input: { id: string }) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status !== "ready") {
        return serviceFail("invalid_state", { message: "Only published assets can be unpublished" });
      }
      await setGlobalLibraryItemStatus({ tx, id: input.id, status: "pending" });
      return requireGlobalLibraryItem(tx, input.id);
    },

    archive: async (tx: Transaction, input: { id: string }) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Asset is already archived" });
      }
      await setGlobalLibraryItemStatus({ tx, id: input.id, status: "archived" });
      return requireGlobalLibraryItem(tx, input.id);
    },

    createUploadTarget: async (
      tx: Transaction,
      input: {
        id: string;
        role: UploadRole;
        contentType: string;
        byteSize: number;
      },
    ) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot accept uploads" });
      }

      const key = buildLibraryObjectKey({
        scope: "global",
        assetClass: detail.assetClass,
        libraryItemId: detail.id,
        role: toBlobRole(input.role),
        extension: extensionFor(input.role, input.contentType),
      });

      const target = await deps.storage.createUploadTarget({
        key,
        contentType: input.contentType,
        byteSize: input.byteSize,
        expiresInSeconds: 15 * 60,
      });

      return serviceOk(target);
    },

    finalizeUpload: async (
      tx: Transaction,
      input: {
        id: string;
        role: UploadRole;
        key: string;
        contentType: string;
      },
    ) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot accept uploads" });
      }

      const head = await deps.storage.head(input.key);
      if (!head) {
        return serviceFail("invalid_state", { message: "Upload not found in storage" });
      }

      return attachUploadedFile(tx, {
        id: input.id,
        role: input.role,
        key: input.key,
        contentType: input.contentType || head.contentType || "application/octet-stream",
        byteSize: head.byteSize ?? 0,
        checksum: head.etag,
      });
    },

    /** Used when the browser cannot PUT directly (e.g. memory adapter in local dev). */
    putAndFinalize: async (
      tx: Transaction,
      input: {
        id: string;
        role: UploadRole;
        key: string;
        contentType: string;
        dataBase64: string;
      },
    ) => {
      const detail = await getGlobalLibraryItem({ tx, id: input.id });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot accept uploads" });
      }

      const body = Uint8Array.from(Buffer.from(input.dataBase64, "base64"));
      const putResult = await deps.storage.put({
        key: input.key,
        contentType: input.contentType,
        body,
      });

      return attachUploadedFile(tx, {
        id: input.id,
        role: input.role,
        key: input.key,
        contentType: input.contentType,
        byteSize: putResult.byteSize ?? body.byteLength,
        checksum: putResult.etag,
      });
    },
  };
}

async function attachUploadedFile(
  tx: Transaction,
  input: {
    id: string;
    role: UploadRole;
    key: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  },
) {
  const file = await insertLibraryFile({
    tx,
    blobPath: input.key,
    contentType: input.contentType,
    byteSize: input.byteSize,
    checksum: input.checksum,
  });

  const attached = await attachFileToLibraryItem({
    tx,
    libraryItemId: input.id,
    role: input.role,
    fileId: file.id,
  });
  if (attached === "not_found") {
    return serviceFail("not_found", { message: "Asset not found" });
  }
  if (attached === "invalid_role") {
    return serviceFail("invalid_state", { message: "Invalid upload role for this asset class" });
  }

  return requireGlobalLibraryItem(tx, input.id);
}

export type LibraryService = ReturnType<typeof createLibraryService>;
