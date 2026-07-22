import { describe, expect, it } from "vitest";

import type { PlacedCanvasItem } from "@/contexts/web-canvas-context";

import { getCanvasItemPreviewSrc, svgToDataUri } from "@/utils/canvas-item-src";

function createItem(overrides: Partial<PlacedCanvasItem> = {}): PlacedCanvasItem {
  return {
    instanceId: "item-1",
    variantId: "variant-1",
    name: "Test asset",
    imageUrl: "https://example.com/logo.png",
    insert: { type: "image", imageUrl: "https://example.com/logo.png" },
    metadata: {},
    x: 0.1,
    y: 0.2,
    width: 0.25,
    ...overrides,
  };
}

describe("canvas-item-src", () => {
  it("encodes SVG as a data URI", () => {
    const uri = svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(decodeURIComponent(uri.replace("data:image/svg+xml;charset=utf-8,", ""))).toContain(
      "<svg",
    );
  });

  it("uses the SVG insert payload for preview when imageUrl is empty", () => {
    const src = getCanvasItemPreviewSrc(
      createItem({
        name: "Harvey ball 86%",
        imageUrl: "",
        insert: {
          type: "svg",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
        },
      }),
    );

    expect(src).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it("falls back to imageUrl for image inserts", () => {
    const src = getCanvasItemPreviewSrc(createItem());

    expect(src).toBe("https://example.com/logo.png");
  });
});
