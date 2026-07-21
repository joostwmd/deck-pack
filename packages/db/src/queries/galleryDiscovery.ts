import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Transaction } from "../transaction";
import {
  FLAG_VARIANT_ROLES,
  type FlagVariantRole,
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

const shapeSvgFiles = alias(files, "disc_shape_svg_files");
const slideThumbFiles = alias(files, "disc_slide_thumb_files");
const slidePresentationFiles = alias(files, "disc_slide_presentation_files");
const flagPreviewFiles = alias(files, "disc_flag_preview_files");

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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

async function loadAliasesByItemId(
  tx: Transaction,
  itemIds: string[],
): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) return new Map();

  const rows = await tx
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
  tx: Transaction,
  itemIds: string[],
): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) return new Map();

  const rows = await tx
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

export type ReadyShapeRow = {
  id: string;
  displayName: string;
  category: ShapeCategory;
  scope: "global" | "org";
  createdAt: Date;
  updatedAt: Date;
  svgBlobPath: string;
  svgContentType: string;
};

export async function searchReadyShapes({
  tx,
  category,
  organizationId,
  internalOnly,
}: {
  tx: Transaction;
  category?: ShapeCategory;
  organizationId?: string | null;
  internalOnly?: boolean;
}): Promise<ReadyShapeRow[]> {
  const filters = [
    eq(galleryItems.assetClass, "shape"),
    discoveryScopeFilter({ organizationId, internalOnly }),
    eq(galleryItems.status, "ready"),
    sql`${shapeItems.svgFileId} IS NOT NULL`,
  ];
  if (category) {
    filters.push(eq(shapeItems.category, category));
  }

  return tx
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      scope: galleryItems.scope,
      category: shapeItems.category,
      createdAt: galleryItems.createdAt,
      updatedAt: galleryItems.updatedAt,
      svgBlobPath: shapeSvgFiles.blobPath,
      svgContentType: shapeSvgFiles.contentType,
    })
    .from(galleryItems)
    .innerJoin(shapeItems, eq(shapeItems.galleryItemId, galleryItems.id))
    .innerJoin(shapeSvgFiles, eq(shapeSvgFiles.id, shapeItems.svgFileId))
    .where(and(...filters))
    .orderBy(desc(galleryItems.updatedAt), asc(galleryItems.displayName));
}

export type ReadySlideRow = {
  id: string;
  displayName: string;
  category: SlideCategory;
  aspectRatio: SlideAspectRatio;
  scope: "global" | "org";
  createdAt: Date;
  updatedAt: Date;
  thumbnailBlobPath: string;
  presentationBlobPath: string;
  aliases: string[];
};

export type SlideDiscoverySort = "relevance" | "newest" | "name";

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

export async function searchReadySlides({
  tx,
  query,
  category,
  tags,
  aspectRatio,
  sort = "relevance",
  organizationId,
  internalOnly,
}: {
  tx: Transaction;
  query?: string;
  category?: SlideCategory;
  tags?: string[];
  aspectRatio?: SlideAspectRatio;
  sort?: SlideDiscoverySort;
  organizationId?: string | null;
  internalOnly?: boolean;
}): Promise<ReadySlideRow[]> {
  const filters = [
    eq(galleryItems.assetClass, "slide"),
    discoveryScopeFilter({ organizationId, internalOnly }),
    eq(galleryItems.status, "ready"),
    sql`${slideItems.presentationFileId} IS NOT NULL`,
    sql`${slideItems.thumbnailFileId} IS NOT NULL`,
  ];
  if (category) filters.push(eq(slideItems.category, category));
  if (aspectRatio) filters.push(eq(slideItems.aspectRatio, aspectRatio));

  const baseRows = await tx
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      scope: galleryItems.scope,
      category: slideItems.category,
      aspectRatio: slideItems.aspectRatio,
      createdAt: galleryItems.createdAt,
      updatedAt: galleryItems.updatedAt,
      thumbnailBlobPath: slideThumbFiles.blobPath,
      presentationBlobPath: slidePresentationFiles.blobPath,
    })
    .from(galleryItems)
    .innerJoin(slideItems, eq(slideItems.galleryItemId, galleryItems.id))
    .innerJoin(slideThumbFiles, eq(slideThumbFiles.id, slideItems.thumbnailFileId))
    .innerJoin(slidePresentationFiles, eq(slidePresentationFiles.id, slideItems.presentationFileId))
    .where(and(...filters));

  const itemIds = baseRows.map((row) => row.id);
  const aliasesByItem = await loadAliasesByItemId(tx, itemIds);
  const searchableByItem = await loadSearchableNamesByItemId(tx, itemIds);

  const normalizedQuery = normalizeName(query ?? "");
  const normalizedTags = (tags ?? []).map((tag) => normalizeName(tag)).filter(Boolean);

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

/** All ready slides (for facet building) — same file requirements as search. */
export async function listAllReadySlides({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId?: string | null;
}): Promise<ReadySlideRow[]> {
  return searchReadySlides({ tx, organizationId });
}

export type ReadyFlagSearchRow = {
  id: string;
  displayName: string;
  code: string;
  scope: "global" | "org";
  previewBlobPath: string;
};

export async function searchReadyFlags({
  tx,
  query,
  organizationId,
  internalOnly,
}: {
  tx: Transaction;
  query?: string;
  organizationId?: string | null;
  internalOnly?: boolean;
}): Promise<ReadyFlagSearchRow[]> {
  const rows = await tx
    .select({
      id: galleryItems.id,
      displayName: galleryItems.displayName,
      code: flagItems.code,
      scope: galleryItems.scope,
      previewBlobPath: flagPreviewFiles.blobPath,
    })
    .from(galleryItems)
    .innerJoin(flagItems, eq(flagItems.galleryItemId, galleryItems.id))
    .innerJoin(
      flagVariants,
      and(eq(flagVariants.flagItemId, flagItems.galleryItemId), eq(flagVariants.role, "rectangle")),
    )
    .innerJoin(flagPreviewFiles, eq(flagPreviewFiles.id, flagVariants.fileId))
    .where(
      and(
        eq(galleryItems.assetClass, "flag"),
        discoveryScopeFilter({ organizationId, internalOnly }),
        eq(galleryItems.status, "ready"),
      ),
    )
    .orderBy(asc(galleryItems.displayName));

  const normalizedQuery = normalizeName(query ?? "");
  if (!normalizedQuery) return rows;

  const searchableByItem = await loadSearchableNamesByItemId(
    tx,
    rows.map((row) => row.id),
  );

  return rows.filter((row) => {
    const names = searchableByItem.get(row.id) ?? [];
    const haystack = [row.displayName, row.code, ...names].map(normalizeName).join(" ");
    return haystack.includes(normalizedQuery);
  });
}

export type ReadyFlagDetailsRow = {
  id: string;
  displayName: string;
  code: string;
  variants: Array<{
    role: FlagVariantRole;
    blobPath: string;
    contentType: string;
  }>;
};

export async function getReadyFlagDetails({
  tx,
  id,
  organizationId,
}: {
  tx: Transaction;
  id: string;
  organizationId?: string | null;
}): Promise<ReadyFlagDetailsRow | null> {
  const [item] = await tx
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
        eq(galleryItems.id, id),
        discoveryScopeFilter({ organizationId }),
        eq(galleryItems.status, "ready"),
        eq(galleryItems.assetClass, "flag"),
      ),
    )
    .limit(1);

  if (!item) return null;

  const [flagRow] = await tx
    .select({ code: flagItems.code })
    .from(flagItems)
    .where(eq(flagItems.galleryItemId, id))
    .limit(1);
  if (!flagRow) return null;

  const variantRows = await tx
    .select({
      role: flagVariants.role,
      blobPath: files.blobPath,
      contentType: files.contentType,
    })
    .from(flagVariants)
    .innerJoin(files, eq(files.id, flagVariants.fileId))
    .where(eq(flagVariants.flagItemId, id));

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
