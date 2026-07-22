import { describe, expect, it } from "vitest";

import { shapeSearchInputSchema } from "@deck-pack/gallery/schemas";

describe("shape schemas", () => {
  it("accepts shape search filters", () => {
    const parsed = shapeSearchInputSchema.parse({
      category: "Arrows",
    });

    expect(parsed).toEqual({
      category: "Arrows",
    });
  });

  it("allows blank shape browsing", () => {
    const parsed = shapeSearchInputSchema.parse({});

    expect(parsed).toEqual({});
  });
});
