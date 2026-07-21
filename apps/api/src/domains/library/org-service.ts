import type { Transaction } from "@deck-pack/db/transaction";
import type {
  CreateOrgLibraryItemInput,
  LibraryItemDetail,
} from "@deck-pack/db/queries/libraryAdmin";
import {
  attachFileToLibraryItem,
  createOrgLibraryItem,
  getOrgLibraryItem,
  insertLibraryFile,
  isLibraryItemPublishable,
  listOrgLibraryItems,
  setOrgLibraryItemStatus,
  updateOrgLibraryItemMetadata,
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

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

import { uploadTargetForClient } from "./upload-target-for-client";

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

async function requireOrgLibraryItem(
  tx: Transaction,
  organizationId: string,
  id: string,
): Promise<ServiceResult<LibraryItemDetail>> {
  const detail = await getOrgLibraryItem({ tx, id, organizationId });
  if (!detail) return serviceFail("not_found", { message: "Asset not found" });
  return serviceOk(detail);
}

export type OrgLibraryServiceDeps = {
  storage: ObjectStorage;
};

export function createOrgLibraryService(deps: OrgLibraryServiceDeps) {
  return {
    list: async (
      tx: Transaction,
      input: {
        organizationId: string;
        assetClass: LibraryAssetClass;
        includeArchived?: boolean;
      },
    ) => {
      const rows = await listOrgLibraryItems({
        tx,
        organizationId: input.organizationId,
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
      input: { organizationId: string; id: string },
    ): Promise<ServiceResult<LibraryItemDetail>> => {
      return requireOrgLibraryItem(tx, input.organizationId, input.id);
    },

    create: async (
      tx: Transaction,
      input: CreateOrgLibraryItemInput,
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
      const created = await createOrgLibraryItem({ tx, input });
      return serviceOk(created);
    },

    update: async (
      tx: Transaction,
      input: {
        organizationId: string;
        id: string;
        displayName: string;
        aliases: string[];
        flagCode?: string;
        category?: ShapeCategory | SlideCategory;
        aspectRatio?: SlideAspectRatio;
      },
    ) => {
      const result = await updateOrgLibraryItemMetadata({ tx, ...input });
      if (result === "not_found") {
        return serviceFail("not_found", { message: "Asset not found" });
      }
      if (result === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot be edited" });
      }
      return requireOrgLibraryItem(tx, input.organizationId, input.id);
    },

    publish: async (tx: Transaction, input: { organizationId: string; id: string }) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
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
      await setOrgLibraryItemStatus({
        tx,
        id: input.id,
        organizationId: input.organizationId,
        status: "ready",
      });
      return requireOrgLibraryItem(tx, input.organizationId, input.id);
    },

    unpublish: async (tx: Transaction, input: { organizationId: string; id: string }) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status !== "ready") {
        return serviceFail("invalid_state", {
          message: "Only published assets can be unpublished",
        });
      }
      await setOrgLibraryItemStatus({
        tx,
        id: input.id,
        organizationId: input.organizationId,
        status: "pending",
      });
      return requireOrgLibraryItem(tx, input.organizationId, input.id);
    },

    archive: async (tx: Transaction, input: { organizationId: string; id: string }) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Asset is already archived" });
      }
      await setOrgLibraryItemStatus({
        tx,
        id: input.id,
        organizationId: input.organizationId,
        status: "archived",
      });
      return requireOrgLibraryItem(tx, input.organizationId, input.id);
    },

    createUploadTarget: async (
      tx: Transaction,
      input: {
        organizationId: string;
        id: string;
        role: UploadRole;
        contentType: string;
        byteSize: number;
      },
    ) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot accept uploads" });
      }

      const key = buildLibraryObjectKey({
        scope: "org",
        organizationId: input.organizationId,
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

      return serviceOk(uploadTargetForClient(target));
    },

    finalizeUpload: async (
      tx: Transaction,
      input: {
        organizationId: string;
        id: string;
        role: UploadRole;
        key: string;
        contentType: string;
      },
    ) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
      if (!detail) return serviceFail("not_found", { message: "Asset not found" });
      if (detail.status === "archived") {
        return serviceFail("invalid_state", { message: "Archived assets cannot accept uploads" });
      }

      const head = await deps.storage.head(input.key);
      if (!head) {
        return serviceFail("invalid_state", { message: "Upload not found in storage" });
      }

      return attachOrgUploadedFile(tx, {
        organizationId: input.organizationId,
        id: input.id,
        role: input.role,
        key: input.key,
        contentType: input.contentType || head.contentType || "application/octet-stream",
        byteSize: head.byteSize ?? 0,
        checksum: head.etag,
      });
    },

    putAndFinalize: async (
      tx: Transaction,
      input: {
        organizationId: string;
        id: string;
        role: UploadRole;
        key: string;
        contentType: string;
        dataBase64: string;
      },
    ) => {
      const detail = await getOrgLibraryItem({
        tx,
        id: input.id,
        organizationId: input.organizationId,
      });
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

      return attachOrgUploadedFile(tx, {
        organizationId: input.organizationId,
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

async function attachOrgUploadedFile(
  tx: Transaction,
  input: {
    organizationId: string;
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

  return requireOrgLibraryItem(tx, input.organizationId, input.id);
}

export type OrgLibraryService = ReturnType<typeof createOrgLibraryService>;
