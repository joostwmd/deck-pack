import { and, asc, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Transaction } from "../transaction";
import {
  FLAG_VARIANT_ROLES,
  type FlagVariantRole,
  type LibraryAssetClass,
  type LibraryItemStatus,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  type ShapeCategory,
  type SlideAspectRatio,
  type SlideCategory,
  files,
  flagItems,
  flagVariants,
  libraryItemNames,
  libraryItems,
  shapeItems,
  slideItems,
} from "../schema/library-assets";

const shapeSvgFiles = alias(files, "shape_svg_files");
const slideThumbFiles = alias(files, "slide_thumb_files");
const flagPreviewFiles = alias(files, "flag_preview_files");

export type LibraryListItem = {
  id: string;
  assetClass: LibraryAssetClass;
  status: LibraryItemStatus;
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

export type LibraryFileRef = {
  id: string;
  blobPath: string;
  contentType: string;
  byteSize: number;
};

export type LibraryItemDetail = {
  id: string;
  assetClass: LibraryAssetClass;
  scope: "global" | "org";
  status: LibraryItemStatus;
  displayName: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
  flag: { code: string; variants: Array<{ role: FlagVariantRole; file: LibraryFileRef }> } | null;
  shape: { category: ShapeCategory; svgFile: LibraryFileRef | null } | null;
  slide: {
    category: SlideCategory;
    aspectRatio: SlideAspectRatio;
    presentationFile: LibraryFileRef | null;
    thumbnailFile: LibraryFileRef | null;
  } | null;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function loadFile(
  tx: Transaction,
  fileId: string | null,
): Promise<LibraryFileRef | null> {
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

export async function listGlobalLibraryItems({
  tx,
  assetClass,
  includeArchived = false,
}: {
  tx: Transaction;
  assetClass: LibraryAssetClass;
  includeArchived?: boolean;
}): Promise<LibraryListItem[]> {
  const filters = [
    eq(libraryItems.assetClass, assetClass),
    eq(libraryItems.scope, "global"),
  ];
  if (!includeArchived) {
    filters.push(ne(libraryItems.status, "archived"));
  }

  const rows = await tx
    .select({
      id: libraryItems.id,
      assetClass: libraryItems.assetClass,
      status: libraryItems.status,
      displayName: libraryItems.displayName,
      updatedAt: libraryItems.updatedAt,
      createdAt: libraryItems.createdAt,
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
    .from(libraryItems)
    .leftJoin(shapeItems, eq(shapeItems.libraryItemId, libraryItems.id))
    .leftJoin(shapeSvgFiles, eq(shapeSvgFiles.id, shapeItems.svgFileId))
    .leftJoin(slideItems, eq(slideItems.libraryItemId, libraryItems.id))
    .leftJoin(slideThumbFiles, eq(slideThumbFiles.id, slideItems.thumbnailFileId))
    .leftJoin(flagItems, eq(flagItems.libraryItemId, libraryItems.id))
    .leftJoin(
      flagVariants,
      and(
        eq(flagVariants.flagItemId, flagItems.libraryItemId),
        eq(flagVariants.role, "rectangle"),
      ),
    )
    .leftJoin(flagPreviewFiles, eq(flagPreviewFiles.id, flagVariants.fileId))
    .where(and(...filters))
    .orderBy(desc(libraryItems.updatedAt), asc(libraryItems.displayName));

  return rows.map((row) => {
    const previewBlobPath =
      row.shapeSvgBlobPath ?? row.slideThumbBlobPath ?? row.flagPreviewBlobPath ?? null;
    const previewContentType =
      row.shapeSvgContentType ??
      row.slideThumbContentType ??
      row.flagPreviewContentType ??
      null;

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

async function getLibraryItemDetail({
  tx,
  id,
  scopeFilter,
}: {
  tx: Transaction;
  id: string;
  scopeFilter?: { scope: "global" } | { scope: "org"; organizationId: string };
}): Promise<LibraryItemDetail | null> {
  const conditions = [eq(libraryItems.id, id)];
  if (scopeFilter?.scope === "global") {
    conditions.push(eq(libraryItems.scope, "global"));
  }
  if (scopeFilter?.scope === "org") {
    conditions.push(eq(libraryItems.scope, "org"));
    conditions.push(eq(libraryItems.organizationId, scopeFilter.organizationId));
  }

  const [item] = await tx
    .select()
    .from(libraryItems)
    .where(and(...conditions))
    .limit(1);

  if (!item) return null;

  const nameRows = await tx
    .select({
      name: libraryItemNames.name,
      kind: libraryItemNames.kind,
    })
    .from(libraryItemNames)
    .where(eq(libraryItemNames.libraryItemId, id));

  const aliases = nameRows
    .filter((row) => row.kind === "alias")
    .map((row) => row.name);

  let flag: LibraryItemDetail["flag"] = null;
  let shape: LibraryItemDetail["shape"] = null;
  let slide: LibraryItemDetail["slide"] = null;

  if (item.assetClass === "flag") {
    const [flagRow] = await tx
      .select()
      .from(flagItems)
      .where(eq(flagItems.libraryItemId, id))
      .limit(1);
    if (flagRow) {
      const variantRows = await tx
        .select({
          role: flagVariants.role,
          fileId: flagVariants.fileId,
        })
        .from(flagVariants)
        .where(eq(flagVariants.flagItemId, id));
      const variants: Array<{ role: FlagVariantRole; file: LibraryFileRef }> = [];
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
      .where(eq(shapeItems.libraryItemId, id))
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
      .where(eq(slideItems.libraryItemId, id))
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

export async function getGlobalLibraryItem({
  tx,
  id,
}: {
  tx: Transaction;
  id: string;
}): Promise<LibraryItemDetail | null> {
  return getLibraryItemDetail({ tx, id, scopeFilter: { scope: "global" } });
}

export async function getOrgLibraryItem({
  tx,
  id,
  organizationId,
}: {
  tx: Transaction;
  id: string;
  organizationId: string;
}): Promise<LibraryItemDetail | null> {
  return getLibraryItemDetail({ tx, id, scopeFilter: { scope: "org", organizationId } });
}

async function listLibraryItemsByScope({
  tx,
  assetClass,
  includeArchived = false,
  scopeFilter,
}: {
  tx: Transaction;
  assetClass: LibraryAssetClass;
  includeArchived?: boolean;
  scopeFilter: { scope: "global" } | { scope: "org"; organizationId: string };
}): Promise<LibraryListItem[]> {
  const filters = [eq(libraryItems.assetClass, assetClass), eq(libraryItems.scope, scopeFilter.scope)];
  if (scopeFilter.scope === "org") {
    filters.push(eq(libraryItems.organizationId, scopeFilter.organizationId));
  }
  if (!includeArchived) {
    filters.push(ne(libraryItems.status, "archived"));
  }

  const rows = await tx
    .select({
      id: libraryItems.id,
      assetClass: libraryItems.assetClass,
      status: libraryItems.status,
      displayName: libraryItems.displayName,
      updatedAt: libraryItems.updatedAt,
      createdAt: libraryItems.createdAt,
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
    .from(libraryItems)
    .leftJoin(shapeItems, eq(shapeItems.libraryItemId, libraryItems.id))
    .leftJoin(shapeSvgFiles, eq(shapeSvgFiles.id, shapeItems.svgFileId))
    .leftJoin(slideItems, eq(slideItems.libraryItemId, libraryItems.id))
    .leftJoin(slideThumbFiles, eq(slideThumbFiles.id, slideItems.thumbnailFileId))
    .leftJoin(flagItems, eq(flagItems.libraryItemId, libraryItems.id))
    .leftJoin(
      flagVariants,
      and(
        eq(flagVariants.flagItemId, flagItems.libraryItemId),
        eq(flagVariants.role, "rectangle"),
      ),
    )
    .leftJoin(flagPreviewFiles, eq(flagPreviewFiles.id, flagVariants.fileId))
    .where(and(...filters))
    .orderBy(desc(libraryItems.updatedAt), asc(libraryItems.displayName));

  return rows.map((row) => {
    const previewBlobPath =
      row.shapeSvgBlobPath ?? row.slideThumbBlobPath ?? row.flagPreviewBlobPath ?? null;
    const previewContentType =
      row.shapeSvgContentType ??
      row.slideThumbContentType ??
      row.flagPreviewContentType ??
      null;

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

export async function listOrgLibraryItems({
  tx,
  organizationId,
  assetClass,
  includeArchived = false,
}: {
  tx: Transaction;
  organizationId: string;
  assetClass: LibraryAssetClass;
  includeArchived?: boolean;
}): Promise<LibraryListItem[]> {
  return listLibraryItemsByScope({
    tx,
    assetClass,
    includeArchived,
    scopeFilter: { scope: "org", organizationId },
  });
}

export type CreateGlobalLibraryItemInput = {
  assetClass: LibraryAssetClass;
  displayName: string;
  aliases?: string[];
  createdByUserId: string | null;
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
};

export async function createGlobalLibraryItem({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateGlobalLibraryItemInput;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const displayName = input.displayName.trim();

  await tx.insert(libraryItems).values({
    id,
    assetClass: input.assetClass,
    scope: "global",
    organizationId: null,
    status: "pending",
    displayName,
    createdByUserId: input.createdByUserId,
  });

  await tx.insert(libraryItemNames).values({
    libraryItemId: id,
    name: displayName,
    normalizedName: normalizeName(displayName),
    kind: "display",
  });

  for (const alias of input.aliases ?? []) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(displayName)) continue;
    await tx.insert(libraryItemNames).values({
      libraryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (input.assetClass === "flag") {
    const code = (input.flagCode ?? "").trim().toUpperCase();
    await tx.insert(flagItems).values({ libraryItemId: id, code });
    if (code) {
      await tx.insert(libraryItemNames).values({
        libraryItemId: id,
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
      libraryItemId: id,
      category,
      svgFileId: null,
    });
  }

  if (input.assetClass === "slide") {
    const category = (SLIDE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as SlideCategory)
      : SLIDE_CATEGORIES[0];
    const aspectRatio = (SLIDE_ASPECT_RATIOS as readonly string[]).includes(
      input.aspectRatio ?? "",
    )
      ? (input.aspectRatio as SlideAspectRatio)
      : SLIDE_ASPECT_RATIOS[0];
    await tx.insert(slideItems).values({
      libraryItemId: id,
      category,
      aspectRatio,
      presentationFileId: null,
      thumbnailFileId: null,
    });
  }

  return { id };
}

export async function updateGlobalLibraryItemMetadata({
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
  const detail = await getLibraryItemDetail({ tx, id });
  if (!detail) return "not_found";
  if (detail.status === "archived") return "archived";

  const trimmedName = displayName.trim();
  await tx
    .update(libraryItems)
    .set({ displayName: trimmedName, updatedAt: new Date() })
    .where(eq(libraryItems.id, id));

  await tx.delete(libraryItemNames).where(eq(libraryItemNames.libraryItemId, id));
  await tx.insert(libraryItemNames).values({
    libraryItemId: id,
    name: trimmedName,
    normalizedName: normalizeName(trimmedName),
    kind: "display",
  });
  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(trimmedName)) continue;
    await tx.insert(libraryItemNames).values({
      libraryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (detail.assetClass === "flag" && flagCode !== undefined) {
    const code = flagCode.trim().toUpperCase();
    await tx.update(flagItems).set({ code }).where(eq(flagItems.libraryItemId, id));
    if (code) {
      await tx.insert(libraryItemNames).values({
        libraryItemId: id,
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
      .where(eq(shapeItems.libraryItemId, id));
  }

  if (detail.assetClass === "slide") {
    await tx
      .update(slideItems)
      .set({
        ...(category !== undefined ? { category: category as SlideCategory } : {}),
        ...(aspectRatio !== undefined
          ? { aspectRatio: aspectRatio as SlideAspectRatio }
          : {}),
      })
      .where(eq(slideItems.libraryItemId, id));
  }

  return "ok";
}

export async function setGlobalLibraryItemStatus({
  tx,
  id,
  status,
}: {
  tx: Transaction;
  id: string;
  status: LibraryItemStatus;
}): Promise<"ok" | "not_found"> {
  const [item] = await tx
    .select({ id: libraryItems.id })
    .from(libraryItems)
    .where(and(eq(libraryItems.id, id), eq(libraryItems.scope, "global")))
    .limit(1);
  if (!item) return "not_found";

  await tx
    .update(libraryItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(libraryItems.id, id));
  return "ok";
}

export async function insertLibraryFile({
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

export async function attachFileToLibraryItem({
  tx,
  libraryItemId,
  role,
  fileId,
}: {
  tx: Transaction;
  libraryItemId: string;
  role: "svg" | "presentation" | "thumbnail" | FlagVariantRole;
  fileId: string;
}): Promise<"ok" | "not_found" | "invalid_role"> {
  const item = await getLibraryItemDetail({ tx, id: libraryItemId });
  if (!item) return "not_found";

  if (item.assetClass === "shape") {
    if (role !== "svg") return "invalid_role";
    await tx
      .update(shapeItems)
      .set({ svgFileId: fileId })
      .where(eq(shapeItems.libraryItemId, libraryItemId));
    await tx
      .update(libraryItems)
      .set({ updatedAt: new Date() })
      .where(eq(libraryItems.id, libraryItemId));
    return "ok";
  }

  if (item.assetClass === "slide") {
    if (role !== "presentation" && role !== "thumbnail") return "invalid_role";
    await tx
      .update(slideItems)
      .set(role === "presentation" ? { presentationFileId: fileId } : { thumbnailFileId: fileId })
      .where(eq(slideItems.libraryItemId, libraryItemId));
    await tx
      .update(libraryItems)
      .set({ updatedAt: new Date() })
      .where(eq(libraryItems.id, libraryItemId));
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
      .where(
        and(eq(flagVariants.flagItemId, libraryItemId), eq(flagVariants.role, variantRole)),
      )
      .limit(1);

    if (existing) {
      await tx
        .update(flagVariants)
        .set({ fileId })
        .where(eq(flagVariants.id, existing.id));
    } else {
      await tx.insert(flagVariants).values({
        flagItemId: libraryItemId,
        role: variantRole,
        fileId,
      });
    }
    await tx
      .update(libraryItems)
      .set({ updatedAt: new Date() })
      .where(eq(libraryItems.id, libraryItemId));
    return "ok";
  }

  return "invalid_role";
}

export function isLibraryItemPublishable(detail: LibraryItemDetail): {
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

export type CreateOrgLibraryItemInput = CreateGlobalLibraryItemInput & {
  organizationId: string;
};

export async function createOrgLibraryItem({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateOrgLibraryItemInput;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const displayName = input.displayName.trim();

  await tx.insert(libraryItems).values({
    id,
    assetClass: input.assetClass,
    scope: "org",
    organizationId: input.organizationId,
    status: "pending",
    displayName,
    createdByUserId: input.createdByUserId,
  });

  await tx.insert(libraryItemNames).values({
    libraryItemId: id,
    name: displayName,
    normalizedName: normalizeName(displayName),
    kind: "display",
  });

  for (const alias of input.aliases ?? []) {
    const trimmed = alias.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(displayName)) continue;
    await tx.insert(libraryItemNames).values({
      libraryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (input.assetClass === "flag") {
    const code = (input.flagCode ?? "").trim().toUpperCase();
    await tx.insert(flagItems).values({ libraryItemId: id, code });
    if (code) {
      await tx.insert(libraryItemNames).values({
        libraryItemId: id,
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
      libraryItemId: id,
      category,
      svgFileId: null,
    });
  }

  if (input.assetClass === "slide") {
    const category = (SLIDE_CATEGORIES as readonly string[]).includes(input.category ?? "")
      ? (input.category as SlideCategory)
      : SLIDE_CATEGORIES[0];
    const aspectRatio = (SLIDE_ASPECT_RATIOS as readonly string[]).includes(
      input.aspectRatio ?? "",
    )
      ? (input.aspectRatio as SlideAspectRatio)
      : SLIDE_ASPECT_RATIOS[0];
    await tx.insert(slideItems).values({
      libraryItemId: id,
      category,
      aspectRatio,
      presentationFileId: null,
      thumbnailFileId: null,
    });
  }

  return { id };
}

export async function updateOrgLibraryItemMetadata({
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
  const detail = await getOrgLibraryItem({ tx, id, organizationId });
  if (!detail) return "not_found";
  if (detail.status === "archived") return "archived";

  return updateGlobalLibraryItemMetadata({
    tx,
    id,
    displayName,
    aliases,
    flagCode,
    category,
    aspectRatio,
  });
}

export async function setOrgLibraryItemStatus({
  tx,
  id,
  organizationId,
  status,
}: {
  tx: Transaction;
  id: string;
  organizationId: string;
  status: LibraryItemStatus;
}): Promise<"ok" | "not_found"> {
  const [item] = await tx
    .select({ id: libraryItems.id })
    .from(libraryItems)
    .where(
      and(
        eq(libraryItems.id, id),
        eq(libraryItems.scope, "org"),
        eq(libraryItems.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!item) return "not_found";

  await tx
    .update(libraryItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(libraryItems.id, id));
  return "ok";
}
