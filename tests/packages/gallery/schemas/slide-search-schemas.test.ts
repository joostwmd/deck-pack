import { describe, expect, it } from "vitest";

import {
  slideAspectRatioSchema,
  slideSearchInputSchema,
  slideSortSchema,
} from "@deck-pack/gallery/schemas";

describe("slide schemas", () => {
  it("accepts slide search filters and defaults", () => {
    const parsed = slideSearchInputSchema.parse({
      query: "agenda",
      category: "Agenda",
      tags: ["outline"],
      aspectRatio: "16:9",
    });

    expect(parsed).toEqual({
      query: "agenda",
      category: "Agenda",
      tags: ["outline"],
      aspectRatio: "16:9",
      sort: "relevance",
    });
  });

  it("allows blank slide browsing", () => {
    const parsed = slideSearchInputSchema.parse({});

    expect(parsed).toEqual({
      sort: "relevance",
    });
  });

  it("rejects invalid slide filter values", () => {
    expect(() => slideAspectRatioSchema.parse("21:9")).toThrow();
    expect(() => slideSortSchema.parse("popular")).toThrow();
    expect(() =>
      slideSearchInputSchema.parse({
        query: "a".repeat(101),
      }),
    ).toThrow();
  });
});
