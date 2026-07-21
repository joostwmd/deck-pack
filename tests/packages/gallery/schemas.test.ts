import { describe, expect, it } from "vitest";

import {
  libraryAssetClassSchema,
  libraryItemDetailSchema,
  libraryUploadRoleSchema,
  uploadTargetSchema,
} from "@deck-pack/gallery/schemas";

describe("gallery schemas", () => {
  it("accepts asset classes and upload roles", () => {
    expect(libraryAssetClassSchema.parse("flag")).toBe("flag");
    expect(libraryUploadRoleSchema.parse("rectangle")).toBe("rectangle");
    expect(libraryUploadRoleSchema.parse("svg")).toBe("svg");
  });

  it("accepts a shape detail payload", () => {
    const parsed = libraryItemDetailSchema.parse({
      id: "item_1",
      assetClass: "shape",
      scope: "global",
      status: "pending",
      displayName: "Arrow",
      aliases: ["pointer"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      flag: null,
      shape: {
        category: "Arrows",
        svgFile: {
          id: "file_1",
          blobPath: "global/shape/item_1/svg.svg",
          contentType: "image/svg+xml",
          byteSize: 120,
        },
      },
      slide: null,
    });

    expect(parsed.shape?.category).toBe("Arrows");
    expect(parsed.status).toBe("pending");
  });

  it("accepts upload target payloads", () => {
    const parsed = uploadTargetSchema.parse({
      key: "global/shape/item_1/svg.svg",
      uploadUrl: "memory://global/shape/item_1/svg.svg",
      method: "PUT",
      headers: { "Content-Type": "image/svg+xml" },
      expiresAt: new Date("2026-01-01T00:15:00.000Z"),
      mode: "proxy",
    });

    expect(parsed.method).toBe("PUT");
    expect(parsed.mode).toBe("proxy");
  });
});
