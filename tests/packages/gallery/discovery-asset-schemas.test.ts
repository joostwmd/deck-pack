import { describe, expect, it } from "vitest";

import {
  assetClientSchema,
  assetTypeSchema,
  flagExternalIdSchema,
  flagSearchQuerySchema,
} from "@deck-pack/gallery/schemas";
import { iconExternalIdSchema, iconSearchQuerySchema } from "@deck-pack/icons/schemas";
import { logoExternalIdSchema, logoSearchQuerySchema } from "@deck-pack/logos/schemas";

describe("discovery asset schemas", () => {
  it("accepts valid search queries", () => {
    expect(logoSearchQuerySchema.parse("apple")).toBe("apple");
    expect(iconSearchQuerySchema.parse("apple")).toBe("apple");
    expect(flagSearchQuerySchema.parse("apple")).toBe("apple");
  });

  it("rejects empty search queries", () => {
    expect(() => logoSearchQuerySchema.parse("")).toThrow();
    expect(() => iconSearchQuerySchema.parse("")).toThrow();
    expect(() => flagSearchQuerySchema.parse("")).toThrow();
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
    expect(logoExternalIdSchema.parse("brand-123")).toBe("brand-123");
    expect(iconExternalIdSchema.parse("brand-123")).toBe("brand-123");
    expect(flagExternalIdSchema.parse("brand-123")).toBe("brand-123");
    expect(() => logoExternalIdSchema.parse("")).toThrow();
  });
});
