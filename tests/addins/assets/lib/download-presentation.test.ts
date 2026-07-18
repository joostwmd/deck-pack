import { describe, expect, it } from "vitest";

import type { PlacedCanvasItem } from "@/contexts/web-canvas-context";
import {
  CANVAS_ASPECT,
  SLIDE_HEIGHT_IN,
  SLIDE_WIDTH_IN,
  getHeightFraction,
  toSlideCoordinates,
} from "@/lib/download-presentation";

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

describe("getHeightFraction", () => {
  it("scales width by the 16:9 canvas aspect ratio", () => {
    expect(getHeightFraction(0.2)).toBeCloseTo(0.2 * CANVAS_ASPECT);
  });
});

describe("toSlideCoordinates", () => {
  it("maps normalized canvas fractions to widescreen slide inches", () => {
    const item = createItem({ x: 0.5, y: 0.25, width: 0.2 });
    const placement = toSlideCoordinates(item);

    expect(placement).toEqual({
      x: 0.5 * SLIDE_WIDTH_IN,
      y: 0.25 * SLIDE_HEIGHT_IN,
      w: 0.2 * SLIDE_WIDTH_IN,
      h: getHeightFraction(0.2) * SLIDE_HEIGHT_IN,
    });
  });

  it("preserves square pixel proportions on a 16:9 slide", () => {
    const item = createItem({ width: 0.3 });
    const placement = toSlideCoordinates(item);

    expect(placement.w).toBeCloseTo(placement.h);
  });
});
