import type { PlacedCanvasItem } from "@/contexts/web-canvas-context";

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export function getCanvasItemPreviewSrc(item: PlacedCanvasItem): string {
  if (item.insert.type === "svg" && item.insert.svg) {
    return svgToDataUri(item.insert.svg);
  }

  return item.imageUrl;
}
