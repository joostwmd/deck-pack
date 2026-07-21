import { searchReadyShapes, type ReadyShapeRow } from "@deck-pack/db/queries/libraryDiscovery";
import { SHAPE_CATEGORIES } from "@deck-pack/db/library-catalog";
import type { Transaction } from "@deck-pack/db/transaction";
import type { ObjectStorage } from "@deck-pack/storage";
import type { z } from "zod";

import { createDiscoveryDownloadUrl } from "@deck-pack/gallery";

import type { shapeSearchInputSchema, shapeSearchResponseSchema } from "./schemas";

export type ShapeServiceDeps = {
  storage: ObjectStorage;
};

async function mapShapeRow(
  storage: ObjectStorage,
  row: ReadyShapeRow,
): Promise<z.infer<typeof shapeSearchResponseSchema>["results"][number] | null> {
  const svgUrl = await createDiscoveryDownloadUrl(storage, row.svgBlobPath);
  if (!svgUrl) return null;

  return {
    id: row.id,
    name: row.displayName,
    category: row.category,
    scope: row.scope,
    thumbnailUrl: svgUrl,
    svgUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createShapeService(deps: ShapeServiceDeps) {
  return {
    search: async (
      tx: Transaction,
      input: z.infer<typeof shapeSearchInputSchema> & { organizationId?: string | null },
    ): Promise<z.infer<typeof shapeSearchResponseSchema>> => {
      const rows = await searchReadyShapes({
        tx,
        category: input.category,
        organizationId: input.organizationId,
        internalOnly: input.internalOnly,
      });

      const mapped = (await Promise.all(rows.map((row) => mapShapeRow(deps.storage, row)))).filter(
        (row): row is NonNullable<typeof row> => row != null,
      );

      const categoriesInResults = new Set(mapped.map((row) => row.category));
      const facets = {
        categories: SHAPE_CATEGORIES.filter((category) => categoriesInResults.has(category)),
      };

      return {
        results: mapped,
        total: mapped.length,
        facets,
      };
    },
  };
}

export type ShapeService = ReturnType<typeof createShapeService>;
