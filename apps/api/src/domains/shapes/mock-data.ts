import type { z } from "zod";

import type { ShapeCategory } from "@deck-pack/db/schema/library-assets";

import type { shapeSearchInputSchema, shapeSearchResponseSchema } from "./schemas";

export interface ShapeCatalogEntry {
  id: string;
  name: string;
  category: ShapeCategory;
  thumbnailUrl: string;
  svgUrl: string;
  createdAt: string;
}

export const shapeCatalog: ShapeCatalogEntry[] = [
  {
    id: "arrow-curved-1",
    name: "Curved Arrow",
    category: "Arrows",
    thumbnailUrl: "/mock-shapes/arrow-curved-1.svg",
    svgUrl: "/mock-shapes/arrow-curved-1.svg",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "arrow-block-1",
    name: "Block Arrow",
    category: "Arrows",
    thumbnailUrl: "/mock-shapes/arrow-block-1.svg",
    svgUrl: "/mock-shapes/arrow-block-1.svg",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "arrow-double-1",
    name: "Double Arrow",
    category: "Arrows",
    thumbnailUrl: "/mock-shapes/arrow-double-1.svg",
    svgUrl: "/mock-shapes/arrow-double-1.svg",
    createdAt: "2026-06-03T10:00:00.000Z",
  },
  {
    id: "banner-ribbon-1",
    name: "Ribbon Banner",
    category: "Banners & Ribbons",
    thumbnailUrl: "/mock-shapes/banner-ribbon-1.svg",
    svgUrl: "/mock-shapes/banner-ribbon-1.svg",
    createdAt: "2026-06-04T10:00:00.000Z",
  },
  {
    id: "banner-curved-1",
    name: "Curved Banner",
    category: "Banners & Ribbons",
    thumbnailUrl: "/mock-shapes/banner-curved-1.svg",
    svgUrl: "/mock-shapes/banner-curved-1.svg",
    createdAt: "2026-06-05T10:00:00.000Z",
  },
  {
    id: "callout-speech-1",
    name: "Speech Bubble",
    category: "Callouts",
    thumbnailUrl: "/mock-shapes/callout-speech-1.svg",
    svgUrl: "/mock-shapes/callout-speech-1.svg",
    createdAt: "2026-06-06T10:00:00.000Z",
  },
  {
    id: "callout-rounded-1",
    name: "Rounded Callout",
    category: "Callouts",
    thumbnailUrl: "/mock-shapes/callout-rounded-1.svg",
    svgUrl: "/mock-shapes/callout-rounded-1.svg",
    createdAt: "2026-06-07T10:00:00.000Z",
  },
  {
    id: "bracket-curly-1",
    name: "Curly Bracket",
    category: "Brackets & Dividers",
    thumbnailUrl: "/mock-shapes/bracket-curly-1.svg",
    svgUrl: "/mock-shapes/bracket-curly-1.svg",
    createdAt: "2026-06-08T10:00:00.000Z",
  },
  {
    id: "divider-ornament-1",
    name: "Ornament Divider",
    category: "Brackets & Dividers",
    thumbnailUrl: "/mock-shapes/divider-ornament-1.svg",
    svgUrl: "/mock-shapes/divider-ornament-1.svg",
    createdAt: "2026-06-09T10:00:00.000Z",
  },
  {
    id: "frame-badge-1",
    name: "Star Badge",
    category: "Frames & Badges",
    thumbnailUrl: "/mock-shapes/frame-badge-1.svg",
    svgUrl: "/mock-shapes/frame-badge-1.svg",
    createdAt: "2026-06-10T10:00:00.000Z",
  },
  {
    id: "frame-decorative-1",
    name: "Decorative Frame",
    category: "Frames & Badges",
    thumbnailUrl: "/mock-shapes/frame-decorative-1.svg",
    svgUrl: "/mock-shapes/frame-decorative-1.svg",
    createdAt: "2026-06-11T10:00:00.000Z",
  },
  {
    id: "connector-elbow-1",
    name: "Elbow Connector",
    category: "Lines & Connectors",
    thumbnailUrl: "/mock-shapes/connector-elbow-1.svg",
    svgUrl: "/mock-shapes/connector-elbow-1.svg",
    createdAt: "2026-06-12T10:00:00.000Z",
  },
  {
    id: "line-dashed-1",
    name: "Dashed Line",
    category: "Lines & Connectors",
    thumbnailUrl: "/mock-shapes/line-dashed-1.svg",
    svgUrl: "/mock-shapes/line-dashed-1.svg",
    createdAt: "2026-06-13T10:00:00.000Z",
  },
  {
    id: "line-connector-dots-1",
    name: "Connector with Dots",
    category: "Lines & Connectors",
    thumbnailUrl: "/mock-shapes/line-connector-dots-1.svg",
    svgUrl: "/mock-shapes/line-connector-dots-1.svg",
    createdAt: "2026-06-14T10:00:00.000Z",
  },
];

function matchesCategory(shape: ShapeCatalogEntry, category: string | undefined) {
  return !category || shape.category === category;
}

function buildFacets(shapes: ShapeCatalogEntry[]) {
  const categories = [...new Set(shapes.map((shape) => shape.category))].sort() as Array<
    z.infer<typeof shapeSearchResponseSchema>["facets"]["categories"][number]
  >;

  return {
    categories,
  } satisfies z.infer<typeof shapeSearchResponseSchema>["facets"];
}

export function searchShapesMock(
  input: z.infer<typeof shapeSearchInputSchema>,
): z.infer<typeof shapeSearchResponseSchema> {
  const filtered = shapeCatalog.filter((shape) => matchesCategory(shape, input.category));

  const results = [...filtered].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return {
    results,
    total: results.length,
    facets: buildFacets(shapeCatalog),
  };
}
