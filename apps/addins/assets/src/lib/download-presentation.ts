import PptxGenJS from "pptxgenjs";

import type { PlacedCanvasItem } from "@/contexts/web-canvas-context";

import { urlToBase64 } from "./url-to-base64";

/** Canvas is 16:9; square item height as fraction of canvas height */
export const CANVAS_ASPECT = 16 / 9;

/** Widescreen slide dimensions used by PptxGenJS `LAYOUT_WIDE` (inches). */
export const SLIDE_WIDTH_IN = 13.33;
export const SLIDE_HEIGHT_IN = 7.5;

export const DEFAULT_PPTX_FILENAME = "deck-pack-slide.pptx";

export function getHeightFraction(itemWidth: number) {
  return itemWidth * CANVAS_ASPECT;
}

export interface SlideImagePlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function toSlideCoordinates(item: PlacedCanvasItem): SlideImagePlacement {
  const heightFraction = getHeightFraction(item.width);

  return {
    x: item.x * SLIDE_WIDTH_IN,
    y: item.y * SLIDE_HEIGHT_IN,
    w: item.width * SLIDE_WIDTH_IN,
    h: heightFraction * SLIDE_HEIGHT_IN,
  };
}

function svgToDataUri(svg: string) {
  const encoded = encodeURIComponent(svg.trim());
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

async function resolveImageData(item: PlacedCanvasItem): Promise<string> {
  if (item.insert.type === "svg" && item.insert.svg) {
    return svgToDataUri(item.insert.svg);
  }

  const imageUrl = item.insert.imageUrl ?? item.imageUrl;
  const base64 = await urlToBase64(imageUrl);
  return `data:image/png;base64,${base64}`;
}

export async function downloadCanvasAsPptx(
  items: PlacedCanvasItem[],
  filename: string = DEFAULT_PPTX_FILENAME,
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  for (const item of items) {
    const placement = toSlideCoordinates(item);
    const data = await resolveImageData(item);

    slide.addImage({
      data,
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
      sizing: { type: "contain", w: placement.w, h: placement.h },
      altText: item.name,
    });
  }

  await pptx.writeFile({ fileName: filename });
}
