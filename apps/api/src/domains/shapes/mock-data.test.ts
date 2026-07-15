import { describe, expect, it } from "vitest";

import { searchShapesMock } from "./mock-data";

describe("searchShapesMock", () => {
  it("returns all shapes when no category is provided", () => {
    const response = searchShapesMock({});

    expect(response.total).toBe(14);
    expect(response.results).toHaveLength(14);
    expect(response.facets.categories).toContain("Arrows");
    expect(response.facets.categories).toContain("Banners & Ribbons");
    expect(response.facets.categories).toContain("Callouts");
    expect(response.facets.categories).toContain("Brackets & Dividers");
    expect(response.facets.categories).toContain("Frames & Badges");
    expect(response.facets.categories).toContain("Lines & Connectors");
  });

  it("filters by category", () => {
    const response = searchShapesMock({ category: "Arrows" });

    expect(response.total).toBe(3);
    expect(response.results.every((shape) => shape.category === "Arrows")).toBe(true);
    expect(response.results.map((shape) => shape.id)).toEqual([
      "arrow-double-1",
      "arrow-block-1",
      "arrow-curved-1",
    ]);
  });

  it("returns empty results for unknown category", () => {
    const response = searchShapesMock({ category: "Nonexistent" });

    expect(response.total).toBe(0);
    expect(response.results).toHaveLength(0);
    expect(response.facets.categories.length).toBeGreaterThan(0);
  });
});
