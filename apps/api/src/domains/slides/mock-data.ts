import type { z } from "zod";

import type {
  SlideAspectRatio,
  SlideCategory,
} from "@deck-pack/db/schema/library-assets";

import type {
  slideAspectRatioSchema,
  slideSearchInputSchema,
  slideSearchResponseSchema,
} from "./schemas";

export interface SlideCatalogEntry {
  id: string;
  name: string;
  thumbnailUrl: string;
  presentationUrl: string;
  category: SlideCategory;
  tags: string[];
  aspectRatio: SlideAspectRatio;
  createdAt: string;
}

export const slideCatalog: SlideCatalogEntry[] = [
  {
    id: "slide-title-hero",
    name: "Title Hero",
    thumbnailUrl: "/mock-slides/thumbnails/title-hero.svg",
    presentationUrl: "/mock-slides/title-hero.pptx",
    category: "Intro",
    tags: ["title", "cover", "hero"],
    aspectRatio: "16:9",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "slide-agenda-simple",
    name: "Simple Agenda",
    thumbnailUrl: "/mock-slides/thumbnails/agenda-simple.svg",
    presentationUrl: "/mock-slides/agenda-simple.pptx",
    category: "Agenda",
    tags: ["agenda", "outline", "list"],
    aspectRatio: "16:9",
    createdAt: "2026-01-20T14:30:00.000Z",
  },
  {
    id: "slide-two-column",
    name: "Two Column Content",
    thumbnailUrl: "/mock-slides/thumbnails/two-column.svg",
    presentationUrl: "/mock-slides/two-column.pptx",
    category: "Content",
    tags: ["content", "comparison", "columns"],
    aspectRatio: "16:9",
    createdAt: "2026-02-01T09:15:00.000Z",
  },
  {
    id: "slide-chart-focus",
    name: "Chart Focus",
    thumbnailUrl: "/mock-slides/thumbnails/chart-focus.svg",
    presentationUrl: "/mock-slides/chart-focus.pptx",
    category: "Data",
    tags: ["chart", "data", "metrics"],
    aspectRatio: "16:9",
    createdAt: "2026-02-10T16:45:00.000Z",
  },
  {
    id: "slide-team-grid",
    name: "Team Grid",
    thumbnailUrl: "/mock-slides/thumbnails/team-grid.svg",
    presentationUrl: "/mock-slides/team-grid.pptx",
    category: "People",
    tags: ["team", "people", "org"],
    aspectRatio: "16:9",
    createdAt: "2026-02-18T11:20:00.000Z",
  },
  {
    id: "slide-closing-cta",
    name: "Closing CTA",
    thumbnailUrl: "/mock-slides/thumbnails/closing-cta.svg",
    presentationUrl: "/mock-slides/closing-cta.pptx",
    category: "Closing",
    tags: ["closing", "cta", "contact"],
    aspectRatio: "16:9",
    createdAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "slide-classic-title",
    name: "Classic Title",
    thumbnailUrl: "/mock-slides/thumbnails/classic-title.svg",
    presentationUrl: "/mock-slides/classic-title.pptx",
    category: "Intro",
    tags: ["title", "classic", "formal"],
    aspectRatio: "4:3",
    createdAt: "2026-03-05T13:10:00.000Z",
  },
  {
    id: "slide-timeline",
    name: "Timeline Roadmap",
    thumbnailUrl: "/mock-slides/thumbnails/timeline.svg",
    presentationUrl: "/mock-slides/timeline.pptx",
    category: "Content",
    tags: ["timeline", "roadmap", "planning"],
    aspectRatio: "16:9",
    createdAt: "2026-03-12T17:30:00.000Z",
  },
];

function normalizeQuery(query: string | undefined) {
  return query?.trim().toLowerCase() ?? "";
}

function matchesQuery(slide: SlideCatalogEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [slide.name, slide.category, ...slide.tags].join(" ").toLowerCase();
  return haystack.includes(query);
}

function matchesCategory(slide: SlideCatalogEntry, category: string | undefined) {
  return !category || slide.category === category;
}

function matchesTags(slide: SlideCatalogEntry, tags: string[] | undefined) {
  if (!tags || tags.length === 0) {
    return true;
  }

  return tags.some((tag) => slide.tags.includes(tag));
}

function matchesAspectRatio(
  slide: SlideCatalogEntry,
  aspectRatio: z.infer<typeof slideAspectRatioSchema> | undefined,
) {
  return !aspectRatio || slide.aspectRatio === aspectRatio;
}

function relevanceScore(slide: SlideCatalogEntry, query: string) {
  if (!query) {
    return 0;
  }

  const name = slide.name.toLowerCase();
  const category = slide.category.toLowerCase();

  if (name === query) {
    return 100;
  }

  if (name.startsWith(query)) {
    return 80;
  }

  if (name.includes(query)) {
    return 60;
  }

  if (category.includes(query)) {
    return 40;
  }

  if (slide.tags.some((tag) => tag.includes(query))) {
    return 30;
  }

  return 0;
}

function sortSlides(
  slides: SlideCatalogEntry[],
  sort: z.infer<typeof slideSearchInputSchema>["sort"],
  query: string,
) {
  const sorted = [...slides];

  if (sort === "newest") {
    sorted.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
    return sorted;
  }

  if (sort === "name") {
    sorted.sort((left, right) => left.name.localeCompare(right.name));
    return sorted;
  }

  if (query) {
    sorted.sort((left, right) => {
      const scoreDelta = relevanceScore(right, query) - relevanceScore(left, query);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.name.localeCompare(right.name);
    });
    return sorted;
  }

  sorted.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return sorted;
}

function buildFacets(slides: SlideCatalogEntry[]) {
  const categories = [...new Set(slides.map((slide) => slide.category))].sort();
  const tags = [...new Set(slides.flatMap((slide) => slide.tags))].sort();
  const aspectRatios = [...new Set(slides.map((slide) => slide.aspectRatio))].sort();

  return {
    categories,
    tags,
    aspectRatios,
  } satisfies z.infer<typeof slideSearchResponseSchema>["facets"];
}

export function searchSlidesMock(
  input: z.infer<typeof slideSearchInputSchema>,
): z.infer<typeof slideSearchResponseSchema> {
  const query = normalizeQuery(input.query);

  const filtered = slideCatalog.filter(
    (slide) =>
      matchesQuery(slide, query) &&
      matchesCategory(slide, input.category) &&
      matchesTags(slide, input.tags) &&
      matchesAspectRatio(slide, input.aspectRatio),
  );

  const results = sortSlides(filtered, input.sort, query);

  return {
    results,
    total: results.length,
    facets: buildFacets(slideCatalog),
  };
}
