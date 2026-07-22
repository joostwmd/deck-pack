import type { SelectedShape, ShapeSelection } from "@deck-pack/shape-commands";
import { getVisualBounds } from "@deck-pack/shape-commands";

import { mapOfficeTextFrameSnapshot } from "../format/text-frame-mappers";
import { shapeSupportsTextFrame, toShapeCapabilities } from "./shape-capabilities";

export type PowerPointShapeProxy = {
  id: string;
  name: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation?: number;
  textFrame?: {
    hasText: boolean;
    autoSizeSetting: string;
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    wordWrap: boolean;
    verticalAlignment: string;
    textRange: {
      text: string;
    };
  };
};

export function mapOfficeShapeToSelectedShape(
  shape: PowerPointShapeProxy,
  selectionIndex: number,
): SelectedShape {
  const type = String(shape.type);
  const rawBounds = {
    left: shape.left,
    top: shape.top,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation ?? 0,
  };

  return {
    id: shape.id,
    name: shape.name,
    type,
    selectionIndex,
    rawBounds,
    visualBounds: getVisualBounds(rawBounds),
    capabilities: toShapeCapabilities(type),
    textFrame: shape.textFrame
      ? mapOfficeTextFrameSnapshot({
          hasText: shape.textFrame.hasText,
          autoSizeSetting: shape.textFrame.autoSizeSetting,
          leftMargin: shape.textFrame.leftMargin,
          rightMargin: shape.textFrame.rightMargin,
          topMargin: shape.textFrame.topMargin,
          bottomMargin: shape.textFrame.bottomMargin,
          wordWrap: shape.textFrame.wordWrap,
          verticalAlignment: shape.textFrame.verticalAlignment,
          text: shape.textFrame.textRange.text,
        })
      : undefined,
  };
}

export function mapOfficeSelection(
  slideId: string,
  shapes: PowerPointShapeProxy[],
): ShapeSelection {
  return {
    slideId,
    shapes: shapes.map((shape, index) => mapOfficeShapeToSelectedShape(shape, index)),
  };
}

export async function readSelectedShapesFromContext(
  context: PowerPoint.RequestContext,
): Promise<ShapeSelection> {
  const selectedSlides = context.presentation.getSelectedSlides();
  selectedSlides.load("items/id");
  await context.sync();

  if (selectedSlides.items.length === 0) {
    return { slideId: "", shapes: [] };
  }

  const slide = selectedSlides.items[0]!;
  const selection = context.presentation.getSelectedShapes();
  selection.load("items/id,items/name,items/type,items/left,items/top,items/width,items/height");
  await context.sync();

  const shapes: PowerPointShapeProxy[] = selection.items.map((shape) => ({
    id: shape.id,
    name: shape.name,
    type: String(shape.type),
    left: shape.left,
    top: shape.top,
    width: shape.width,
    height: shape.height,
    rotation: 0,
  }));

  try {
    for (const shape of selection.items) {
      shape.load("rotation");
    }
    await context.sync();
    for (let index = 0; index < selection.items.length; index += 1) {
      shapes[index]!.rotation = selection.items[index]!.rotation ?? 0;
    }
  } catch {
    // Rotation is unavailable on some hosts/API levels.
  }

  for (let index = 0; index < selection.items.length; index += 1) {
    const shape = selection.items[index]!;
    const proxy = shapes[index]!;

    if (!shapeSupportsTextFrame(proxy.type)) {
      continue;
    }

    try {
      shape.load(
        "textFrame/hasText,textFrame/autoSizeSetting,textFrame/leftMargin,textFrame/rightMargin,textFrame/topMargin,textFrame/bottomMargin,textFrame/wordWrap,textFrame/verticalAlignment,textFrame/textRange/text",
      );
    } catch {
      // Text frame is unavailable on some hosts/API levels.
    }
  }

  await context.sync();

  for (let index = 0; index < selection.items.length; index += 1) {
    const shape = selection.items[index]!;
    const proxy = shapes[index]!;

    if (!shapeSupportsTextFrame(proxy.type)) {
      continue;
    }

    try {
      proxy.textFrame = {
        hasText: shape.textFrame.hasText,
        autoSizeSetting: String(shape.textFrame.autoSizeSetting),
        leftMargin: shape.textFrame.leftMargin,
        rightMargin: shape.textFrame.rightMargin,
        topMargin: shape.textFrame.topMargin,
        bottomMargin: shape.textFrame.bottomMargin,
        wordWrap: shape.textFrame.wordWrap,
        verticalAlignment: String(shape.textFrame.verticalAlignment),
        textRange: {
          text: shape.textFrame.textRange.text,
        },
      };
    } catch {
      // Text frame is unavailable on some hosts/API levels.
    }
  }

  return mapOfficeSelection(slide.id, shapes);
}
