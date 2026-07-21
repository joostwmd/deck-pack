import { describe, expect, it } from "vitest";

import { isGalleryItemPublishable } from "@deck-pack/db/queries/galleryAdmin";
import type { GalleryItemDetail } from "@deck-pack/db/queries/galleryAdmin";

function baseDetail(
  overrides: Partial<GalleryItemDetail> & Pick<GalleryItemDetail, "assetClass">,
): GalleryItemDetail {
  return {
    id: "item_1",
    scope: "global",
    status: "pending",
    displayName: "Test",
    aliases: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    flag: null,
    shape: null,
    slide: null,
    ...overrides,
  };
}

describe("isGalleryItemPublishable", () => {
  it("requires all flag variants", () => {
    const result = isGalleryItemPublishable(
      baseDetail({
        assetClass: "flag",
        flag: {
          code: "US",
          variants: [
            {
              role: "rectangle",
              file: {
                id: "f1",
                blobPath: "a",
                contentType: "image/png",
                byteSize: 1,
              },
            },
          ],
        },
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toContain("variant:square");
    expect(result.missing).toContain("variant:circle");
  });

  it("requires shape svg", () => {
    const result = isGalleryItemPublishable(
      baseDetail({
        assetClass: "shape",
        shape: { category: "Arrows", svgFile: null },
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["svg"]);
  });

  it("accepts a complete slide", () => {
    const file = {
      id: "f1",
      blobPath: "a",
      contentType: "application/octet-stream",
      byteSize: 10,
    };
    const result = isGalleryItemPublishable(
      baseDetail({
        assetClass: "slide",
        slide: {
          category: "Intro",
          aspectRatio: "16:9",
          presentationFile: file,
          thumbnailFile: { ...file, id: "f2" },
        },
      }),
    );

    expect(result).toEqual({ ok: true, missing: [] });
  });
});
