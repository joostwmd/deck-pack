import { describe, expect, it } from "vitest";

import {
  assetClientSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetTypeSchema,
} from "@deck-pack/api/domains/assets/schemas";

describe("assets schemas", () => {
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
    expect(assetTypeSchema.parse("slide")).toBe("slide");
    expect(assetTypeSchema.parse("shape")).toBe("shape");
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
});
