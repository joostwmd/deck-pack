import { describe, expect, it } from "vitest";

import { searchSlidesMock } from "@deck-pack/api/domains/slides/mock-data";

describe("searchSlidesMock", () => {
  it("returns all slides when no filters are provided", () => {
    const response = searchSlidesMock({ sort: "relevance" });

    expect(response.total).toBe(8);
    expect(response.results).toHaveLength(8);
    expect(response.facets.categories).toContain("Intro");
    expect(response.facets.tags).toContain("agenda");
    expect(response.facets.aspectRatios).toEqual(["16:9", "4:3"]);
  });

  it("filters by query across name, category, and tags", () => {
    const byName = searchSlidesMock({ query: "timeline", sort: "relevance" });
    expect(byName.total).toBe(1);
    expect(byName.results[0]?.id).toBe("slide-timeline");

    const byCategory = searchSlidesMock({ query: "closing", sort: "relevance" });
    expect(byCategory.total).toBe(1);
    expect(byCategory.results[0]?.id).toBe("slide-closing-cta");

    const byTag = searchSlidesMock({ query: "roadmap", sort: "relevance" });
    expect(byTag.total).toBe(1);
    expect(byTag.results[0]?.id).toBe("slide-timeline");
  });

  it("combines category, tags, and aspect ratio with AND semantics", () => {
    const response = searchSlidesMock({
      category: "Intro",
      tags: ["title"],
      aspectRatio: "4:3",
      sort: "relevance",
    });

    expect(response.total).toBe(1);
    expect(response.results[0]?.id).toBe("slide-classic-title");
  });

  it("sorts by name and newest", () => {
    const byName = searchSlidesMock({ sort: "name" });
    expect(byName.results[0]?.name).toBe("Chart Focus");

    const newest = searchSlidesMock({ sort: "newest" });
    expect(newest.results[0]?.id).toBe("slide-timeline");
  });

  it("ranks relevance matches ahead of weaker matches", () => {
    const response = searchSlidesMock({ query: "title", sort: "relevance" });

    expect(response.results.map((slide) => slide.id)).toEqual([
      "slide-title-hero",
      "slide-classic-title",
    ]);
  });
});
