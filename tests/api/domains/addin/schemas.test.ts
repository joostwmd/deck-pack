import { describe, expect, it } from "vitest";

import { trackAssetInsertionInputSchema } from "@deck-pack/api/domains/addin/schemas";

describe("addin schemas", () => {
  it("accepts flexible metadata for tracking", () => {
    const parsed = trackAssetInsertionInputSchema.parse({
      assetType: "icon",
      externalId: "icon-1",
      client: "office",
      metadata: {
        variantId: "ios7",
        ICON_PLATFORM: "ios7",
      },
    });

    expect(parsed.metadata).toEqual({
      variantId: "ios7",
      ICON_PLATFORM: "ios7",
    });
  });

  it("accepts harvey ball tracking payloads", () => {
    const parsed = trackAssetInsertionInputSchema.parse({
      assetType: "harvey_ball",
      externalId: "harvey-ball",
      client: "web",
      metadata: {
        TYPE: "HARVEY_BALL",
        PERCENTAGE: "75",
      },
    });

    expect(parsed.assetType).toBe("harvey_ball");
    expect(parsed.metadata).toEqual({
      TYPE: "HARVEY_BALL",
      PERCENTAGE: "75",
    });
  });

  it("accepts photo tracking payloads", () => {
    const parsed = trackAssetInsertionInputSchema.parse({
      assetType: "photo",
      externalId: "2014422",
      client: "office",
      metadata: {
        PHOTOGRAPHER: "Joey Farina",
        INSERT_SOURCE: "large2x",
      },
    });

    expect(parsed.assetType).toBe("photo");
    expect(parsed.metadata).toEqual({
      PHOTOGRAPHER: "Joey Farina",
      INSERT_SOURCE: "large2x",
    });
  });

  it("accepts slide tracking payloads", () => {
    const parsed = trackAssetInsertionInputSchema.parse({
      assetType: "slide",
      externalId: "slide-title-hero",
      client: "office",
      metadata: {
        CATEGORY: "Intro",
        ASPECT_RATIO: "16:9",
      },
    });

    expect(parsed.assetType).toBe("slide");
    expect(parsed.metadata).toEqual({
      CATEGORY: "Intro",
      ASPECT_RATIO: "16:9",
    });
  });

  it("accepts shape tracking payloads", () => {
    const parsed = trackAssetInsertionInputSchema.parse({
      assetType: "shape",
      externalId: "arrow-curved-1",
      client: "office",
      metadata: {
        CATEGORY: "Arrows",
      },
    });

    expect(parsed.assetType).toBe("shape");
    expect(parsed.metadata).toEqual({
      CATEGORY: "Arrows",
    });
  });
});
