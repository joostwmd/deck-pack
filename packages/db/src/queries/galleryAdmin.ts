import { and, asc, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Transaction } from "../transaction";
import {
  FLAG_VARIANT_ROLES,
  type FlagVariantRole,
  type GalleryAssetClass,
  type GalleryItemStatus,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  type ShapeCategory,
  type SlideAspectRatio,
  type SlideCategory,
  files,
  flagItems,
  flagVariants,
  galleryItemNames,
  galleryItems,
  shapeItems,
  slideItems,
} from "../schema/gallery-assets";

const shapeSvgFiles = alias(files, "shape_svg_files");
const slideThumbFiles = alias(files, "slide_thumb_files");
const flagPreviewFiles = alias(files, "flag_preview_files");

export type GalleryListItem = {
  id: string;
  assetClass: GalleryAssetClass;
  status: GalleryItemStatus;
  displayName: string;
  updatedAt: Date;
  createdAt: Date;
  category: string | null;
  code: string | null;
  aspectRatio: string | null;
  /** Blob path of the gallery preview file (shape SVG, slide thumb, or flag rectangle). */
  previewBlobPath: string | null;
  previewContentType: string | null;
};

export type GalleryFileRef = {
  id: string;
  blobPath: string;
  contentType: string;
  byteSize: number;
};

export type GalleryItemDetail = {
  id: string;
  assetClass: GalleryAssetClass;
  scope: "global" | "org";
  status: GalleryItemStatus;
  displayName: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
  flag: { code: string; variants: Array<{ role: FlagVariantRole; file: GalleryFileRef }> } | null;
  shape: { category: ShapeCategory; svgFile: GalleryFileRef | null } | null;
  slide: {
    category: SlideCategory;
    aspectRatio: SlideAspectRatio;
    presentationFile: GalleryFileRef | null;
    thumbnailFile: GalleryFileRef | null;
  } | null;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function loadFile(tx: Transaction, fileId: string | null): Promise<GalleryFileRef | null> {
  if (!fileId) return null;
  const [row] = await tx
    .select({
      id: files.id,
      blobPath: files.blobPath,
      contentType: files.contentType,
      byteSize: files.byteSize,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);
  return row ?? null;
}

export async function listGlobalGalleryItems({
  tx,
  assetClass,
  includeArchived = false,
}: {
  tx: Transaction;
  assetClass: GalleryAssetClass;
  includeArchived?: boolean;
}): Promise<GalleryListItem[]> {
  const filters = [eq(galleryItems.assetClass, assetClass), eq(galleryItems.scope, "global")];
  if (!includeArchived) {
    filters.push(ne(galleryItems.status, "archived"));
  }

  const rows = await tx
    .select({
      id: galleryItems.id,
      assetClass: galleryItems.assetClass,
      status: galleryItems.status,
      displayName: galleryItems.displayName,
      updatedAt: galleryItems.updatedAt,
      createdAt: galleryItems.createdAt,
      shapeCategory: shapeItems.category,
      slideCategory: slideItems.category,
      aspectRatio: slideItems.aspectRatio,
      code: flagItems.code,
      shapeSvgBlobPath: shapeSvgFiles.blobPath,
      shapeSvgContentType: shapeSvgFiles.contentType,
      slideThumbBlobPath: slideThumbFiles.blobPath,
      slideThumbContentType: slideThumbFiles.contentType,
      flagPreviewBlobPath: flagPreviewFiles.blobPath,
      flagPreviewContentType: flagPreviewFiles.contentType,
    })
    .from(galleryItems)
    .leftJoin(shapeItems, eq(shapeItems.galleryItemId, galleryItems.id))
    .leftJoin(shapeSvgFiles, eq(shapeSvgFiles.id, shapeItems.svgFileId))
    .leftJoin(slideItems, eq(slideItems.galleryItemId, galleryItems.id))
    .leftJoin(slideThumbFiles, eq(slideThumbFiles.id, slideItems.thumbnailFileId))
    .leftJoin(flagItems, eq(flagItems.galleryItemId, galleryItems.id))
    .leftJoin(
      flagVariants,
      and(eq(flagVariants.flagItemId, flagItems.galleryItemId), eq(flagVariants.role, "rectangle")),
    )
    .leftJoin(flagPreviewFiles, eq(flagPreviewFiles.id, flagVariants.fileId))
    .where(and(...filters))
    .orderBy(desc(galleryItems.updatedAt), asc(galleryItems.displayName));

  return rows.map((row) => {
    const previewBlobPath =
      row.shapeSvgBlobPath ?? row.slideThumbBlobPath ?? row.flagPreviewBlobPath ?? null;
    const previewContentType =
      row.shapeSvgContentType ?? row.slideThumbContentType ?? row.flagPreviewContentType ?? null;

    return {
      id: row.id,
      assetClass: row.assetClass,
      status: row.status,
      displayName: row.displayName,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      category: row.shapeCategory ?? row.slideCategory ?? null,
      code: row.code ?? null,
      aspectRatio: row.aspectRatio ?? null,
      previewBlobPath,
      previewContentType,
    };
  });
}

async function getGalleryItemDetail({
  tx,
  id,
  scopeFilter,
}: {
  tx: Transaction;
  id: string;
  scopeFilter?: { scope: "global" } | { scope: "org"; organizationId: string };
}): Promise<GalleryItemDetail | null> {
  const conditions = [eq(galleryItems.id, id)];
  if (scopeFilter?.scope === "global") {
    conditions.push(eq(galleryItems.scope, "global"));
  }
  if (scopeFilter?.scope === "org") {
    conditions.push(eq(galleryItems.scope, "org"));
    conditions.push(eq(galleryItems.organizationId, scopeFilter.organizationId));
  }

  const [item] = await tx
    .select()
    .from(galleryItems)
    .where(and(...conditions))
    .limit(1);

  if (!item) return null;

  const nameRows = await tx
    .select({
      name: galleryItemNames.name,
      kind: galleryItemNames.kind,
    })
    .from(galleryItemNames)
    .where(eq(galleryItemNames.galleryItemId, id));

  const aliases = nameRows.filter((row) => row.kind === "alias").map((row) => row.name);

  let flag: GalleryItemDetail["flag"] = null;
  let shape: GalleryItemDetail["shape"] = null;
  let slide: GalleryItemDetail["slide"] = null;

  if (item.assetClass === "flag") {
    const [flagRow] = await tx
      .select()
      .from(flagItems)
      .where(eq(flagItems.galleryItemId, id))
      .limit(1);
    if (flagRow) {
      const variantRows = await tx
        .select({
          role: flagVariants.role,
          fileId: flagVariants.fileId,
        })
        .from(flagVariants)
        .where(eq(flagVariants.flagItemId, id));
      const variants: Array<{ role: FlagVariantRole; file: GalleryFileRef }> = [];
      for (const variant of variantRows) {
        const file = await loadFile(tx, variant.fileId);
        if (file) {
          variants.push({ role: variant.role, file });
        }
      }
      flag = { code: flagRow.code, variants };
    }
  }

  if (item.assetClass === "shape") {
    const [shapeRow] = await tx
      .select()
      .from(shapeItems)
      .where(eq(shapeItems.galleryItemId, id))
      .limit(1);
    if (shapeRow) {
      shape = {
        category: shapeRow.category,
        svgFile: await loadFile(tx, shapeRow.svgFileId),
      };
    }
  }

  if (item.assetClass === "slide") {
    const [slideRow] = await tx
      .select()
      .from(slideItems)
      .where(eq(slideItems.galleryItemId, id))
      .limit(1);
    if (slideRow) {
      slide = {
        category: slideRow.category,
        aspectRatio: slideRow.aspectRatio,
        presentationFile: await loadFile(tx, slideRow.presentationFileId),
        thumbnailFile: await loadFile(tx, slideRow.thumbnailFileId),
      };
    }
  }

  return {
    id: item.id,
    assetClass: item.assetClass,
    scope: item.scope,
    status: item.status,
    displayName: item.displayName,
    aliases,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    flag,
    shape,
    slide,
  };
}

export async function getGlobalGalleryItem({
  tx,
  id,
}: {
  tx: Transaction;
  id: string;
}): Promise<GalleryItemDetail | null> {
  return getGalleryItemDetail({ tx, id, scopeFilter: { scope: "global" } });
}

export async function getOrgGalleryItem({
  tx,
  id,
  organizationId,
}: {
  tx: Transaction;
  id: string;
  organizationId: string;
}): Promise<GalleryItemDetail | null> {
  return getGalleryItemDetail({ tx, id, scopeFilter: { scope: "org", organizationId } });
}

async function listGalleryItemsByScope({
  tx,
  assetClass,
  includeArchived = false,
  scopeFilter,
}: {
  tx: Transaction;
  assetClass: GalleryAssetClass;
  includeArchived?: boolean;
  scopeFilter: { scope: "global" } | { scope: "org"; organizationId: string };
}): Promise<GalleryListItem[]> {
  const filters = [
    eq(galleryItems.assetClass, assetClass),
    eq(galleryItems.scope, scopeFilter.scope),
  ];
  if (scopeFilter.scope === "org") {
    filters.push(eq(galleryItems.organizationId, scopeFilter.organizationId));
  }
  if (!includeArchived) {
    filters.push(ne(galleryItems.status, "archived"));
  }

  const rows = await tx
    .select({
      id: galleryItems.id,
      assetClass: galleryItems.assetClass,
      status: galleryItems.status,
      displayName: galleryItems.displayName,
      updatedAt: galleryItems.updatedAt,
      createdAt: galleryItems.createdAt,
      shapeCategory: shapeItems.category,
      slideCategory: slideItems.category,
      aspectRatio: slideItems.aspectRatio,
      code: flagItems.code,
      shapeSvgBlobPath: shapeSvgFiles.blobPath,
      shapeSvgContentType: shapeSvgFiles.contentType,
      slideThumbBlobPath: slideThumbFiles.blobPath,
      slideThumbContentType: slideThumbFiles.contentType,
      flagPreviewBlobPath: flagPreviewFiles.blobPath,
      flagPreviewContentType: flagPreviewFiles.contentType,
    })
    .from(galleryItems)
    .leftJoin(shapeItems, eq(shapeItems.galleryItemId, galleryItems.id))
    .leftJoin(shapeSvgFiles, eq(shapeSvgFiles.id, shapeItems.svgFileId))
    .leftJoin(slideItems, eq(slideItems.galleryItemId, galleryItems.id))
    .leftJoin(slideThumbFiles, eq(slideThumbFiles.id, slideItems.thumbnailFileId))
    .leftJoin(flagItems, eq(flagItems.galleryItemId, galleryItems.id))
    .leftJoin(
      flagVariants,
      and(eq(flagVariants.flagItemId, flagItems.galleryItemId), eq(flagVariants.role, "rectangle")),
    )
    .leftJoin(flagPreviewFiles, eq(flagPreviewFiles.id, flagVariants.fileId))
    .where(and(...filters))
    .orderBy(desc(galleryItems.updatedAt), asc(galleryItems.displayName));

  return rows.map((row) => {
    const previewBlobPath =
      row.shapeSvgBlobPath ?? row.slideThumbBlobPath ?? row.flagPreviewBlobPath ?? null;
    const previewContentType =
      row.shapeSvgContentType ?? row.slideThumbContentType ?? row.flagPreviewContentType ?? null;

    return {
      id: row.id,
      assetClass: row.assetClass,
      status: row.status,
      displayName: row.displayName,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      category: row.shapeCategory ?? row.slideCategory ?? null,
      code: row.code ?? null,
      aspectRatio: row.aspectRatio ?? null,
      previewBlobPath,
      previewContentType,
    };
  });
}

export async function listOrgGalleryItems({
  tx,
  organizationId,
  assetClass,
  includeArchived = false,
}: {
  tx: Transaction;
  organizationId: string;
  assetClass: GalleryAssetClass;
  includeArchived?: boolean;
}): Promise<GalleryListItem[]> {
  return listGalleryItemsByScope({
    tx,
    assetClass,
    includeArchived,
    scopeFilter: { scope: "org", organizationId },
  });
}

export type CreateGlobalGalleryItemInput = {
  assetClass: GalleryAssetClass;
  displayName: string;
  aliases?: string[];
  createdByUserId: string | null;
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
};

export async function createGlobalGalleryItem({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateGlobalGalleryItemInput;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const displayName = input.displayName.trim();

  await tx.insert(galleryItems).values({
    id,
    assetClass: input.assetClass,
    scope: "global",
    organizationId: null,
    status: "pending",
    displayName,
    createdByUserId: input.createdByUserId,
  });

  await tx.insert(galleryItemNames).values({
    galleryItemId: id,
    name: displayName,
    normalizedName: normalizeName(displayName),
    kind: "display",
  });

  for (const alias of input.aliases ?? []) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(displayName)) continue;
    await tx.insert(galleryItemNames).values({
      galleryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (input.assetClass === "flag") {
    const code = (input.flagCode ?? "").trim().toUpperCase();
    await tx.insert(flagItems).values({ galleryItemId: id, code });
    if (code) {
      await tx.insert(galleryItemNames).values({
        galleryItemId: id,
        name: code,
        normalizedName: normalizeName(code),
        kind: "code",
      });
    }
  }

  if (input.assetClass === "shape") {
    const category = (SHAPE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as ShapeCategory)
      : SHAPE_CATEGORIES[0];
    await tx.insert(shapeItems).values({
      galleryItemId: id,
      category,
      svgFileId: null,
    });
  }

  if (input.assetClass === "slide") {
    const category = (SLIDE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as SlideCategory)
      : SLIDE_CATEGORIES[0];
    const aspectRatio = (SLIDE_ASPECT_RATIOS as readonly string[]).includes(input.aspectRatio ?? "")
      ? (input.aspectRatio as SlideAspectRatio)
      : SLIDE_ASPECT_RATIOS[0];
    await tx.insert(slideItems).values({
      galleryItemId: id,
      category,
      aspectRatio,
      presentationFileId: null,
      thumbnailFileId: null,
    });
  }

  return { id };
}

export async function updateGlobalGalleryItemMetadata({
  tx,
  id,
  displayName,
  aliases,
  flagCode,
  category,
  aspectRatio,
}: {
  tx: Transaction;
  id: string;
  displayName: string;
  aliases: string[];
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
}): Promise<"ok" | "not_found" | "archived"> {
  const detail = await getGalleryItemDetail({ tx, id });
  if (!detail) return "not_found";
  if (detail.status === "archived") return "archived";

  const trimmedName = displayName.trim();
  await tx
    .update(galleryItems)
    .set({ displayName: trimmedName, updatedAt: new Date() })
    .where(eq(galleryItems.id, id));

  await tx.delete(galleryItemNames).where(eq(galleryItemNames.galleryItemId, id));
  await tx.insert(galleryItemNames).values({
    galleryItemId: id,
    name: trimmedName,
    normalizedName: normalizeName(trimmedName),
    kind: "display",
  });
  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(trimmedName)) continue;
    await tx.insert(galleryItemNames).values({
      galleryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (detail.assetClass === "flag" && flagCode !== undefined) {
    const code = flagCode.trim().toUpperCase();
    await tx.update(flagItems).set({ code }).where(eq(flagItems.galleryItemId, id));
    if (code) {
      await tx.insert(galleryItemNames).values({
        galleryItemId: id,
        name: code,
        normalizedName: normalizeName(code),
        kind: "code",
      });
    }
  }

  if (detail.assetClass === "shape" && category !== undefined) {
    await tx
      .update(shapeItems)
      .set({ category: category as ShapeCategory })
      .where(eq(shapeItems.galleryItemId, id));
  }

  if (detail.assetClass === "slide") {
    await tx
      .update(slideItems)
      .set({
        ...(category !== undefined ? { category: category as SlideCategory } : {}),
        ...(aspectRatio !== undefined ? { aspectRatio: aspectRatio as SlideAspectRatio } : {}),
      })
      .where(eq(slideItems.galleryItemId, id));
  }

  return "ok";
}

export async function setGlobalGalleryItemStatus({
  tx,
  id,
  status,
}: {
  tx: Transaction;
  id: string;
  status: GalleryItemStatus;
}): Promise<"ok" | "not_found"> {
  const [item] = await tx
    .select({ id: galleryItems.id })
    .from(galleryItems)
    .where(and(eq(galleryItems.id, id), eq(galleryItems.scope, "global")))
    .limit(1);
  if (!item) return "not_found";

  await tx
    .update(galleryItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(galleryItems.id, id));
  return "ok";
}

export async function insertGalleryFile({
  tx,
  blobPath,
  contentType,
  byteSize,
  checksum,
}: {
  tx: Transaction;
  blobPath: string;
  contentType: string;
  byteSize: number;
  checksum?: string;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await tx.insert(files).values({
    id,
    blobPath,
    contentType,
    byteSize,
    checksum: checksum ?? null,
  });
  return { id };
}

export async function attachFileToGalleryItem({
  tx,
  galleryItemId,
  role,
  fileId,
}: {
  tx: Transaction;
  galleryItemId: string;
  role: "svg" | "presentation" | "thumbnail" | FlagVariantRole;
  fileId: string;
}): Promise<"ok" | "not_found" | "invalid_role"> {
  const item = await getGalleryItemDetail({ tx, id: galleryItemId });
  if (!item) return "not_found";

  if (item.assetClass === "shape") {
    if (role !== "svg") return "invalid_role";
    await tx
      .update(shapeItems)
      .set({ svgFileId: fileId })
      .where(eq(shapeItems.galleryItemId, galleryItemId));
    await tx
      .update(galleryItems)
      .set({ updatedAt: new Date() })
      .where(eq(galleryItems.id, galleryItemId));
    return "ok";
  }

  if (item.assetClass === "slide") {
    if (role !== "presentation" && role !== "thumbnail") return "invalid_role";
    await tx
      .update(slideItems)
      .set(role === "presentation" ? { presentationFileId: fileId } : { thumbnailFileId: fileId })
      .where(eq(slideItems.galleryItemId, galleryItemId));
    await tx
      .update(galleryItems)
      .set({ updatedAt: new Date() })
      .where(eq(galleryItems.id, galleryItemId));
    return "ok";
  }

  if (item.assetClass === "flag") {
    if (!(FLAG_VARIANT_ROLES as readonly string[]).includes(role)) {
      return "invalid_role";
    }
    const variantRole = role as FlagVariantRole;
    const [existing] = await tx
      .select({ id: flagVariants.id })
      .from(flagVariants)
      .where(and(eq(flagVariants.flagItemId, galleryItemId), eq(flagVariants.role, variantRole)))
      .limit(1);

    if (existing) {
      await tx.update(flagVariants).set({ fileId }).where(eq(flagVariants.id, existing.id));
    } else {
      await tx.insert(flagVariants).values({
        flagItemId: galleryItemId,
        role: variantRole,
        fileId,
      });
    }
    await tx
      .update(galleryItems)
      .set({ updatedAt: new Date() })
      .where(eq(galleryItems.id, galleryItemId));
    return "ok";
  }

  return "invalid_role";
}

export function isGalleryItemPublishable(detail: GalleryItemDetail): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (detail.assetClass === "flag") {
    if (!detail.flag?.code) missing.push("code");
    const roles = new Set(detail.flag?.variants.map((v) => v.role) ?? []);
    for (const role of FLAG_VARIANT_ROLES) {
      if (!roles.has(role)) missing.push(`variant:${role}`);
    }
  }
  if (detail.assetClass === "shape") {
    if (!detail.shape?.svgFile) missing.push("svg");
  }
  if (detail.assetClass === "slide") {
    if (!detail.slide?.presentationFile) missing.push("presentation");
    if (!detail.slide?.thumbnailFile) missing.push("thumbnail");
  }
  return { ok: missing.length === 0, missing };
}

export type CreateOrgGalleryItemInput = CreateGlobalGalleryItemInput & {
  organizationId: string;
};

export async function createOrgGalleryItem({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateOrgGalleryItemInput;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const displayName = input.displayName.trim();

  await tx.insert(galleryItems).values({
    id,
    assetClass: input.assetClass,
    scope: "org",
    organizationId: input.organizationId,
    status: "pending",
    displayName,
    createdByUserId: input.createdByUserId,
  });

  await tx.insert(galleryItemNames).values({
    galleryItemId: id,
    name: displayName,
    normalizedName: normalizeName(displayName),
    kind: "display",
  });

  for (const alias of input.aliases ?? []) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(displayName)) continue;
    await tx.insert(galleryItemNames).values({
      galleryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (input.assetClass === "flag") {
    const code = (input.flagCode ?? "").trim().toUpperCase();
    await tx.insert(flagItems).values({ galleryItemId: id, code });
    if (code) {
      await tx.insert(galleryItemNames).values({
        galleryItemId: id,
        name: code,
        normalizedName: normalizeName(code),
        kind: "code",
      });
    }
  }

  if (input.assetClass === "shape") {
    const category = (SHAPE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as ShapeCategory)
      : SHAPE_CATEGORIES[0];
    await tx.insert(shapeItems).values({
      galleryItemId: id,
      category,
      svgFileId: null,
    });
  }

  if (input.assetClass === "slide") {
    const category = (SLIDE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as SlideCategory)
      : SLIDE_CATEGORIES[0];
    const aspectRatio = (SLIDE_ASPECT_RATIOS as readonly string[]).includes(input.aspectRatio ?? "")
      ? (input.aspectRatio as SlideAspectRatio)
      : SLIDE_ASPECT_RATIOS[0];
    await tx.insert(slideItems).values({
      galleryItemId: id,
      category,
      aspectRatio,
      presentationFileId: null,
      thumbnailFileId: null,
    });
  }

  return { id };
}

export async function updateOrgGalleryItemMetadata({
  tx,
  id,
  organizationId,
  displayName,
  aliases,
  flagCode,
  category,
  aspectRatio,
}: {
  tx: Transaction;
  id: string;
  organizationId: string;
  displayName: string;
  aliases: string[];
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
}): Promise<"ok" | "not_found" | "archived"> {
  const detail = await getOrgGalleryItem({ tx, id, organizationId });
  if (!detail) return "not_found";
  if (detail.status === "archived") return "archived";

  return updateGlobalGalleryItemMetadata({
    tx,
    id,
    displayName,
    aliases,
    flagCode,
    category,
    aspectRatio,
  });
}

export async function setOrgGalleryItemStatus({
  tx,
  id,
  organizationId,
  status,
}: {
  tx: Transaction;
  id: string;
  organizationId: string;
  status: GalleryItemStatus;
}): Promise<"ok" | "not_found"> {
  const [item] = await tx
    .select({ id: galleryItems.id })
    .from(galleryItems)
    .where(
      and(
        eq(galleryItems.id, id),
        eq(galleryItems.scope, "org"),
        eq(galleryItems.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!item) return "not_found";

  await tx
    .update(galleryItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(galleryItems.id, id));
  return "ok";
}
