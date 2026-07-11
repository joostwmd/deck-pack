import { describe, expect, it } from "vitest";

import {
  assetClientSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetTypeSchema,
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
  });

  it("rejects unsupported asset types", () => {
    expect(() => assetTypeSchema.parse("photo")).toThrow();
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
});
