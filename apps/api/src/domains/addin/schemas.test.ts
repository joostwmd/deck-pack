import { describe, expect, it } from "vitest";

import {
  assetClientSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetTypeSchema,
  photoColorSchema,
  photoLocaleSchema,
  photoOrientationSchema,
  photoSearchInputSchema,
  photoSizeSchema,
  trackAssetInsertionInputSchema,
} from "./schemas";

describe("addin schemas", () => {
  it("accepts valid search queries", () => {
    expect(assetSearchQuerySchema.parse("apple")).toBe("apple");
  });

  it("rejects empty search queries", () => {
    expect(() => assetSearchQuerySchema.parse("")).toThrow();
  });

  it("accepts supported asset types", () => {
    expect(assetTypeSchema.parse("logo")).toBe("logo");
    expect(assetTypeSchema.parse("flag")).toBe("flag");
    expect(assetTypeSchema.parse("icon")).toBe("icon");
    expect(assetTypeSchema.parse("harvey_ball")).toBe("harvey_ball");
    expect(assetTypeSchema.parse("photo")).toBe("photo");
  });

  it("rejects unsupported asset types", () => {
    expect(() => assetTypeSchema.parse("video")).toThrow();
  });

  it("accepts supported clients", () => {
    expect(assetClientSchema.parse("office")).toBe("office");
    expect(assetClientSchema.parse("web")).toBe("web");
  });

  it("requires external ids", () => {
    expect(assetExternalIdSchema.parse("brand-123")).toBe("brand-123");
    expect(() => assetExternalIdSchema.parse("")).toThrow();
  });

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

  it("accepts photo search filters and pagination defaults", () => {
    const parsed = photoSearchInputSchema.parse({
      query: "ocean",
      orientation: "landscape",
      color: "#112233",
      locale: "en-US",
    });

    expect(parsed).toEqual({
      query: "ocean",
      orientation: "landscape",
      color: "#112233",
      locale: "en-US",
      page: 1,
      perPage: 24,
    });
  });

  it("rejects invalid photo filter values", () => {
    expect(() => photoOrientationSchema.parse("panorama")).toThrow();
    expect(() => photoSizeSchema.parse("huge")).toThrow();
    expect(() => photoColorSchema.parse("#12")).toThrow();
    expect(() => photoLocaleSchema.parse("en-GB")).toThrow();
    expect(() =>
      photoSearchInputSchema.parse({
        query: "ocean",
        page: 0,
      }),
    ).toThrow();
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
});
