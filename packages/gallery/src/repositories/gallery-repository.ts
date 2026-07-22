import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { UnitOfWork } from "@deck-pack/db";
import {
  FLAG_VARIANT_ROLES,
  type FlagVariantRole,
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
} from "@deck-pack/db/schema/gallery-assets";

import type {
  GetReadyFlagDetailsInput,
  ReadyFlagDetailsRow,
  ReadyFlagSearchRow,
  ReadyShapeRow,
  ReadySlideRow,
  SearchReadyFlagsInput,
  SearchReadyShapesInput,
  SearchReadySlidesInput,
  SlideDiscoverySort,
} from "../domain/discovery";
import type {
  CreateGalleryItemInput,
  GalleryAssetClass,
  GalleryFileRef,
  GalleryItemDetail,
  GalleryItemStatus,
  GalleryListItem,
  GalleryScope,
  GalleryUploadRole,
  UpdateGalleryItemMetadataInput,
} from "../domain/gallery-item";

type Db = ReturnType<UnitOfWork["getDb"]>;

const shapeSvgFiles = alias(files, "shape_svg_files");
const slideThumbFiles = alias(files, "slide_thumb_files");
const flagPreviewFiles = alias(files, "flag_preview_files");

const discShapeSvgFiles = alias(files, "disc_shape_svg_files");
const discSlideThumbFiles = alias(files, "disc_slide_thumb_files");
const discSlidePresentationFiles = alias(files, "disc_slide_presentation_files");
const discFlagPreviewFiles = alias(files, "disc_flag_preview_files");

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function loadFile(db: Db, fileId: string | null): Promise<GalleryFileRef | null> {
  if (!fileId) return null;
  const [row] = await db
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

async function listGalleryItemsByScope(
  db: Db,
  assetClass: GalleryAssetClass,
  includeArchived: boolean,
  scopeFilter: { scope: "global" } | { scope: "org"; organizationId: string },
): Promise<GalleryListItem[]> {
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

  const rows = await db
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

async function getGalleryItemDetail(
  db: Db,
  id: string,
  scopeFilter?: { scope: "global" } | { scope: "org"; organizationId: string },
): Promise<GalleryItemDetail | null> {
  const conditions = [eq(galleryItems.id, id)];
  if (scopeFilter?.scope === "global") {
    conditions.push(eq(galleryItems.scope, "global"));
  }
  if (scopeFilter?.scope === "org") {
    conditions.push(eq(galleryItems.scope, "org"));
    conditions.push(eq(galleryItems.organizationId, scopeFilter.organizationId));
  }

  const [item] = await db
    .select()
    .from(galleryItems)
    .where(and(...conditions))
    .limit(1);

  if (!item) return null;

  const nameRows = await db
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
    const [flagRow] = await db
      .select()
      .from(flagItems)
      .where(eq(flagItems.galleryItemId, id))
      .limit(1);
    if (flagRow) {
      const variantRows = await db
        .select({
          role: flagVariants.role,
          fileId: flagVariants.fileId,
        })
        .from(flagVariants)
        .where(eq(flagVariants.flagItemId, id));
      const variants: Array<{ role: FlagVariantRole; file: GalleryFileRef }> = [];
      for (const variant of variantRows) {
        const file = await loadFile(db, variant.fileId);
        if (file) {
          variants.push({ role: variant.role, file });
        }
      }
      flag = { code: flagRow.code, variants };
    }
  }

  if (item.assetClass === "shape") {
    const [shapeRow] = await db
      .select()
      .from(shapeItems)
      .where(eq(shapeItems.galleryItemId, id))
      .limit(1);
    if (shapeRow) {
      shape = {
        category: shapeRow.category,
        svgFile: await loadFile(db, shapeRow.svgFileId),
      };
    }
  }

  if (item.assetClass === "slide") {
    const [slideRow] = await db
      .select()
      .from(slideItems)
      .where(eq(slideItems.galleryItemId, id))
      .limit(1);
    if (slideRow) {
      slide = {
        category: slideRow.category,
        aspectRatio: slideRow.aspectRatio,
        presentationFile: await loadFile(db, slideRow.presentationFileId),
        thumbnailFile: await loadFile(db, slideRow.thumbnailFileId),
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

async function createGalleryItem(
  db: Db,
  input: CreateGalleryItemInput & { scope: "global" | "org"; organizationId: string | null },
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const displayName = input.displayName.trim();

  await db.insert(galleryItems).values({
    id,
    assetClass: input.assetClass,
    scope: input.scope,
    organizationId: input.organizationId,
    status: "pending",
    displayName,
    createdByUserId: input.createdByUserId,
  });

  await db.insert(galleryItemNames).values({
    galleryItemId: id,
    name: displayName,
    normalizedName: normalizeName(displayName),
    kind: "display",
  });

  for (const aliasName of input.aliases ?? []) {
    const trimmed = aliasName.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(displayName)) continue;
    await db.insert(galleryItemNames).values({
      galleryItemId: id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (input.assetClass === "flag") {
    const code = (input.flagCode ?? "").trim().toUpperCase();
    await db.insert(flagItems).values({ galleryItemId: id, code });
    if (code) {
      await db.insert(galleryItemNames).values({
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
    await db.insert(shapeItems).values({
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
    await db.insert(slideItems).values({
      galleryItemId: id,
      category,
      aspectRatio,
      presentationFileId: null,
      thumbnailFileId: null,
    });
  }

  return { id };
}

async function updateGalleryItemMetadata(
  db: Db,
  input: UpdateGalleryItemMetadataInput,
): Promise<"ok" | "not_found" | "archived"> {
  const detail = await getGalleryItemDetail(db, input.id);
  if (!detail) return "not_found";
  if (detail.status === "archived") return "archived";

  const trimmedName = input.displayName.trim();
  await db
    .update(galleryItems)
    .set({ displayName: trimmedName, updatedAt: new Date() })
    .where(eq(galleryItems.id, input.id));

  await db.delete(galleryItemNames).where(eq(galleryItemNames.galleryItemId, input.id));
  await db.insert(galleryItemNames).values({
    galleryItemId: input.id,
    name: trimmedName,
    normalizedName: normalizeName(trimmedName),
    kind: "display",
  });
  for (const aliasName of input.aliases) {
    const trimmed = aliasName.trim();
    if (!trimmed || normalizeName(trimmed) === normalizeName(trimmedName)) continue;
    await db.insert(galleryItemNames).values({
      galleryItemId: input.id,
      name: trimmed,
      normalizedName: normalizeName(trimmed),
      kind: "alias",
    });
  }

  if (detail.assetClass === "flag" && input.flagCode !== undefined) {
    const code = input.flagCode.trim().toUpperCase();
    await db.update(flagItems).set({ code }).where(eq(flagItems.galleryItemId, input.id));
    if (code) {
      await db.insert(galleryItemNames).values({
        galleryItemId: input.id,
        name: code,
        normalizedName: normalizeName(code),
        kind: "code",
      });
    }
  }

  if (detail.assetClass === "shape" && input.category !== undefined) {
    await db
      .update(shapeItems)
      .set({ category: input.category as ShapeCategory })
      .where(eq(shapeItems.galleryItemId, input.id));
  }

  if (detail.assetClass === "slide") {
    await db
      .update(slideItems)
      .set({
        ...(input.category !== undefined ? { category: input.category as SlideCategory } : {}),
        ...(input.aspectRatio !== undefined
          ? { aspectRatio: input.aspectRatio as SlideAspectRatio }
          : {}),
      })
      .where(eq(slideItems.galleryItemId, input.id));
  }

  return "ok";
}

async function attachFileToGalleryItem(
  db: Db,
  galleryItemId: string,
  role: GalleryUploadRole,
  fileId: string,
): Promise<"ok" | "not_found" | "invalid_role"> {
  const item = await getGalleryItemDetail(db, galleryItemId);
  if (!item) return "not_found";

  if (item.assetClass === "shape") {
    if (role !== "svg") return "invalid_role";
    await db
      .update(shapeItems)
      .set({ svgFileId: fileId })
      .where(eq(shapeItems.galleryItemId, galleryItemId));
    await db
      .update(galleryItems)
      .set({ updatedAt: new Date() })
      .where(eq(galleryItems.id, galleryItemId));
    return "ok";
  }

  if (item.assetClass === "slide") {
    if (role !== "presentation" && role !== "thumbnail") return "invalid_role";
    await db
      .update(slideItems)
      .set(role === "presentation" ? { presentationFileId: fileId } : { thumbnailFileId: fileId })
      .where(eq(slideItems.galleryItemId, galleryItemId));
    await db
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
    const [existing] = await db
      .select({ id: flagVariants.id })
      .from(flagVariants)
      .where(and(eq(flagVariants.flagItemId, galleryItemId), eq(flagVariants.role, variantRole)))
      .limit(1);

    if (existing) {
      await db.update(flagVariants).set({ fileId }).where(eq(flagVariants.id, existing.id));
    } else {
      await db.insert(flagVariants).values({
        flagItemId: galleryItemId,
        role: variantRole,
        fileId,
      });
    }
    await db
      .update(galleryItems)
      .set({ updatedAt: new Date() })
      .where(eq(galleryItems.id, galleryItemId));
    return "ok";
  }

  return "invalid_role";
}

function discoveryScopeFilter({
  organizationId,
  internalOnly,
}: {
  organizationId?: string | null;
  internalOnly?: boolean;
}) {
  if (internalOnly && organizationId) {
    return and(eq(galleryItems.scope, "org"), eq(galleryItems.organizationId, organizationId));
  }

  if (organizationId) {
    return or(
      eq(galleryItems.scope, "global"),
      and(eq(galleryItems.scope, "org"), eq(galleryItems.organizationId, organizationId)),
    );
  }

  return eq(galleryItems.scope, "global");
}

async function loadAliasesByItemId(db: Db, itemIds: string[]): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) return new Map();

  const rows = await db
    .select({
      galleryItemId: galleryItemNames.galleryItemId,
      name: galleryItemNames.name,
    })
    .from(galleryItemNames)
    .where(
      and(inArray(galleryItemNames.galleryItemId, itemIds), eq(galleryItemNames.kind, "alias")),
    );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.galleryItemId) ?? [];
    existing.push(row.name);
    map.set(row.galleryItemId, existing);
  }
  return map;
}

async function loadSearchableNamesByItemId(
  db: Db,
  itemIds: string[],
): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) return new Map();

  const rows = await db
    .select({
      galleryItemId: galleryItemNames.galleryItemId,
      name: galleryItemNames.name,
    })
    .from(galleryItemNames)
    .where(inArray(galleryItemNames.galleryItemId, itemIds));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.galleryItemId) ?? [];
    existing.push(row.name);
    map.set(row.galleryItemId, existing);
  }
  return map;
}

function slideMatchesQuery(
  row: Omit<ReadySlideRow, "aliases"> & { aliases: string[]; searchableNames: string[] },
  query: string,
): boolean {
  if (!query) return true;
  const haystack = [row.displayName, row.category, ...row.aliases, ...row.searchableNames]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function slideRelevanceScore(
  row: Omit<ReadySlideRow, "aliases"> & { aliases: string[]; searchableNames: string[] },
  query: string,
): number {
  if (!query) return 0;

  const name = row.displayName.toLowerCase();
  const category = row.category.toLowerCase();

  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 60;
  if (category.includes(query)) return 40;
  if (row.aliases.some((tag) => tag.toLowerCase().includes(query))) return 30;
  if (row.searchableNames.some((n) => n.toLowerCase().includes(query))) return 20;
  return 0;
}

function sortReadySlides(
  rows: ReadySlideRow[],
  sort: SlideDiscoverySort,
  query: string,
): ReadySlideRow[] {
  const sorted = [...rows];

  if (sort === "newest") {
    sorted.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
    return sorted;
  }

  if (sort === "name") {
    sorted.sort((left, right) => left.displayName.localeCompare(right.displayName));
    return sorted;
  }

  if (query) {
    sorted.sort((left, right) => {
      const leftScore = slideRelevanceScore(
        { ...left, searchableNames: [left.displayName, ...left.aliases] },
        query,
      );
      const rightScore = slideRelevanceScore(
        { ...right, searchableNames: [right.displayName, ...right.aliases] },
        query,
      );
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.displayName.localeCompare(right.displayName);
    });
    return sorted;
  }

  sorted.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  return sorted;
}

async function searchReadyShapesQuery(
  db: Db,
  input: SearchReadyShapesInput,
): Promise<ReadyShapeRow[]> {
  const filters = [
    eq(galleryItems.assetClass, "shape"),
    discoveryScopeFilter({
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    }),
    eq(galleryItems.status, "ready"),
    sql`${shapeItems.svgFileId} IS NOT NULL`,
  ];
  if (input.category) {
    filters.push(eq(shapeItems.category, input.category));
  }

  return db
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      scope: galleryItems.scope,
      category: shapeItems.category,
      createdAt: galleryItems.createdAt,
      updatedAt: galleryItems.updatedAt,
      svgBlobPath: discShapeSvgFiles.blobPath,
      svgContentType: discShapeSvgFiles.contentType,
    })
    .from(galleryItems)
    .innerJoin(shapeItems, eq(shapeItems.galleryItemId, galleryItems.id))
    .innerJoin(discShapeSvgFiles, eq(discShapeSvgFiles.id, shapeItems.svgFileId))
    .where(and(...filters))
    .orderBy(desc(galleryItems.updatedAt), asc(galleryItems.displayName));
}

async function searchReadySlidesQuery(
  db: Db,
  input: SearchReadySlidesInput,
): Promise<ReadySlideRow[]> {
  const sort = input.sort ?? "relevance";
  const filters = [
    eq(galleryItems.assetClass, "slide"),
    discoveryScopeFilter({
      organizationId: input.organizationId,
      internalOnly: input.internalOnly,
    }),
    eq(galleryItems.status, "ready"),
    sql`${slideItems.presentationFileId} IS NOT NULL`,
    sql`${slideItems.thumbnailFileId} IS NOT NULL`,
  ];
  if (input.category) filters.push(eq(slideItems.category, input.category));
  if (input.aspectRatio) filters.push(eq(slideItems.aspectRatio, input.aspectRatio));

  const baseRows = await db
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      scope: galleryItems.scope,
      category: slideItems.category,
      aspectRatio: slideItems.aspectRatio,
      createdAt: galleryItems.createdAt,
      updatedAt: galleryItems.updatedAt,
      thumbnailBlobPath: discSlideThumbFiles.blobPath,
      presentationBlobPath: discSlidePresentationFiles.blobPath,
    })
    .from(galleryItems)
    .innerJoin(slideItems, eq(slideItems.galleryItemId, galleryItems.id))
    .innerJoin(discSlideThumbFiles, eq(discSlideThumbFiles.id, slideItems.thumbnailFileId))
    .innerJoin(
      discSlidePresentationFiles,
      eq(discSlidePresentationFiles.id, slideItems.presentationFileId),
    )
    .where(and(...filters));

  const itemIds = baseRows.map((row) => row.id);
  const aliasesByItem = await loadAliasesByItemId(db, itemIds);
  const searchableByItem = await loadSearchableNamesByItemId(db, itemIds);

  const normalizedQuery = normalizeName(input.query ?? "");
  const normalizedTags = (input.tags ?? []).map((tag) => normalizeName(tag)).filter(Boolean);

  const withAliases: ReadySlideRow[] = baseRows.map((row) => ({
    ...row,
    scope: row.scope as "global" | "org",
    aliases: aliasesByItem.get(row.id) ?? [],
  }));

  const filtered = withAliases.filter((row) => {
    const searchableNames = searchableByItem.get(row.id) ?? [];
    const enriched = { ...row, searchableNames };
    if (!slideMatchesQuery(enriched, normalizedQuery)) return false;
    if (normalizedTags.length === 0) return true;
    const aliasNormalized = row.aliases.map(normalizeName);
    return normalizedTags.some((tag) => aliasNormalized.includes(tag));
  });

  return sortReadySlides(filtered, sort, normalizedQuery);
}

async function searchReadyFlagsQuery(
  db: Db,
  input: SearchReadyFlagsInput,
): Promise<ReadyFlagSearchRow[]> {
  const rows = await db
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      code: flagItems.code,
      scope: galleryItems.scope,
      previewBlobPath: discFlagPreviewFiles.blobPath,
    })
    .from(galleryItems)
    .innerJoin(flagItems, eq(flagItems.galleryItemId, galleryItems.id))
    .innerJoin(
      flagVariants,
      and(eq(flagVariants.flagItemId, flagItems.galleryItemId), eq(flagVariants.role, "rectangle")),
    )
    .innerJoin(discFlagPreviewFiles, eq(discFlagPreviewFiles.id, flagVariants.fileId))
    .where(
      and(
        eq(galleryItems.assetClass, "flag"),
        discoveryScopeFilter({
          organizationId: input.organizationId,
          internalOnly: input.internalOnly,
        }),
        eq(galleryItems.status, "ready"),
      ),
    )
    .orderBy(asc(galleryItems.displayName));

  const normalizedQuery = normalizeName(input.query ?? "");
  if (!normalizedQuery) return rows;

  const searchableByItem = await loadSearchableNamesByItemId(
    db,
    rows.map((row) => row.id),
  );

  return rows.filter((row) => {
    const names = searchableByItem.get(row.id) ?? [];
    const haystack = [row.displayName, row.code, ...names].map(normalizeName).join(" ");
    return haystack.includes(normalizedQuery);
  });
}

async function getReadyFlagDetailsQuery(
  db: Db,
  input: GetReadyFlagDetailsInput,
): Promise<ReadyFlagDetailsRow | null> {
  const [item] = await db
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      status: galleryItems.status,
      assetClass: galleryItems.assetClass,
      scope: galleryItems.scope,
      organizationId: galleryItems.organizationId,
    })
    .from(galleryItems)
    .where(
      and(
        eq(galleryItems.id, input.id),
        discoveryScopeFilter({ organizationId: input.organizationId }),
        eq(galleryItems.status, "ready"),
        eq(galleryItems.assetClass, "flag"),
      ),
    )
    .limit(1);

  if (!item) return null;

  const [flagRow] = await db
    .select({ code: flagItems.code })
    .from(flagItems)
    .where(eq(flagItems.galleryItemId, input.id))
    .limit(1);
  if (!flagRow) return null;

  const variantRows = await db
    .select({
      role: flagVariants.role,
      blobPath: files.blobPath,
      contentType: files.contentType,
    })
    .from(flagVariants)
    .innerJoin(files, eq(files.id, flagVariants.fileId))
    .where(eq(flagVariants.flagItemId, input.id));

  const roles = new Set(variantRows.map((v) => v.role));
  for (const role of FLAG_VARIANT_ROLES) {
    if (!roles.has(role)) return null;
  }

  return {
    id: item.id,
    displayName: item.displayName,
    code: flagRow.code,
    variants: variantRows.map((variant) => ({
      role: variant.role,
      blobPath: variant.blobPath,
      contentType: variant.contentType,
    })),
  };
}

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

  async list(
    scope: GalleryScope,
    input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
  ): Promise<GalleryListItem[]> {
    const db = this.uow.getDb();
    if (scope.kind === "global") {
      return listGalleryItemsByScope(db, input.assetClass, input.includeArchived ?? false, {
        scope: "global",
      });
    }
    return listGalleryItemsByScope(db, input.assetClass, input.includeArchived ?? false, {
      scope: "org",
      organizationId: scope.organizationId,
    });
  }

  async get(scope: GalleryScope, id: string): Promise<GalleryItemDetail | null> {
    const db = this.uow.getDb();
    if (scope.kind === "global") {
      return getGalleryItemDetail(db, id, { scope: "global" });
    }
    return getGalleryItemDetail(db, id, {
      scope: "org",
      organizationId: scope.organizationId,
    });
  }

  async create(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }> {
    const db = this.uow.getDb();
    if (scope.kind === "global") {
      return createGalleryItem(db, { ...input, scope: "global", organizationId: null });
    }
    return createGalleryItem(db, {
      ...input,
      scope: "org",
      organizationId: scope.organizationId,
    });
  }

  async updateMetadata(
    scope: GalleryScope,
    input: UpdateGalleryItemMetadataInput,
  ): Promise<"ok" | "not_found" | "archived"> {
    const db = this.uow.getDb();
    if (scope.kind === "org") {
      const detail = await getGalleryItemDetail(db, input.id, {
        scope: "org",
        organizationId: scope.organizationId,
      });
      if (!detail) return "not_found";
      if (detail.status === "archived") return "archived";
    }
    return updateGalleryItemMetadata(db, input);
  }

  async setStatus(scope: GalleryScope, id: string, status: GalleryItemStatus): Promise<void> {
    const db = this.uow.getDb();
    if (scope.kind === "global") {
      const [item] = await db
        .select({ id: galleryItems.id })
        .from(galleryItems)
        .where(and(eq(galleryItems.id, id), eq(galleryItems.scope, "global")))
        .limit(1);
      if (!item) return;

      await db
        .update(galleryItems)
        .set({ status, updatedAt: new Date() })
        .where(eq(galleryItems.id, id));
      return;
    }

    const [item] = await db
      .select({ id: galleryItems.id })
      .from(galleryItems)
      .where(
        and(
          eq(galleryItems.id, id),
          eq(galleryItems.scope, "org"),
          eq(galleryItems.organizationId, scope.organizationId),
        ),
      )
      .limit(1);
    if (!item) return;

    await db
      .update(galleryItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(galleryItems.id, id));
  }

  async insertFile(input: {
    blobPath: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  }): Promise<{ id: string }> {
    const db = this.uow.getDb();
    const id = crypto.randomUUID();
    await db.insert(files).values({
      id,
      blobPath: input.blobPath,
      contentType: input.contentType,
      byteSize: input.byteSize,
      checksum: input.checksum ?? null,
    });
    return { id };
  }

  async attachFile(input: {
    galleryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role"> {
    const db = this.uow.getDb();
    return attachFileToGalleryItem(db, input.galleryItemId, input.role, input.fileId);
  }

  async searchReadyFlags(input: SearchReadyFlagsInput): Promise<ReadyFlagSearchRow[]> {
    const db = this.uow.getDb();
    return searchReadyFlagsQuery(db, input);
  }

  async getReadyFlagDetails(input: GetReadyFlagDetailsInput): Promise<ReadyFlagDetailsRow | null> {
    const db = this.uow.getDb();
    return getReadyFlagDetailsQuery(db, input);
  }

  async searchReadyShapes(input: SearchReadyShapesInput): Promise<ReadyShapeRow[]> {
    const db = this.uow.getDb();
    return searchReadyShapesQuery(db, input);
  }

  async searchReadySlides(input: SearchReadySlidesInput): Promise<ReadySlideRow[]> {
    const db = this.uow.getDb();
    return searchReadySlidesQuery(db, input);
  }

  async listAllReadySlides(input: { organizationId?: string | null }): Promise<ReadySlideRow[]> {
    const db = this.uow.getDb();
    return searchReadySlidesQuery(db, { organizationId: input.organizationId });
  }
}
