import type { RawBounds, SelectedShape, ShapeSelection, TextFrameSnapshot, VisualBounds } from "../types";
import { getVisualBounds } from "../geometry/bounds";

export function createShape(
  id: string,
  bounds: Partial<RawBounds> & Pick<RawBounds, "left" | "top" | "width" | "height">,
  options: {
    name?: string;
    type?: string;
    selectionIndex?: number;
    isLine?: boolean;
    supportsBoundsMutation?: boolean;
    supportsResize?: boolean;
    supportsTextFrame?: boolean;
    textFrame?: TextFrameSnapshot;
  } = {},
): SelectedShape {
  const rawBounds: RawBounds = {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    rotation: bounds.rotation ?? 0,
  };

  const visualBounds = getVisualBounds(rawBounds);
  const isLine = options.isLine ?? false;
  const supportsTextFrame = options.supportsTextFrame ?? !isLine;
  const defaultTextFrame: TextFrameSnapshot = {
    hasText: false,
    autoSizeSetting: "none",
    leftMargin: 0,
    rightMargin: 0,
    topMargin: 0,
    bottomMargin: 0,
    wordWrap: true,
    verticalAlignment: "top",
    text: "",
  };

  return {
    id,
    name: options.name ?? id,
    type: options.type ?? (isLine ? "line" : "rectangle"),
    selectionIndex: options.selectionIndex ?? 0,
    rawBounds,
    visualBounds,
    capabilities: {
      supportsBoundsMutation: options.supportsBoundsMutation ?? !isLine,
      supportsResize: options.supportsResize ?? !isLine,
      supportsTextFrame,
      isLine,
    },
    textFrame: supportsTextFrame ? (options.textFrame ?? defaultTextFrame) : options.textFrame,
  };
}

export function selectionOf(
  shapes: SelectedShape[],
  slideId = "slide-1",
): ShapeSelection {
  return {
    slideId,
    shapes: shapes.map((shape, index) => ({
      ...shape,
      selectionIndex: shape.selectionIndex ?? index,
    })),
  };
}

export function selectionFromBounds(
  entries: Array<{ id: string; left: number; top: number; width: number; height: number; rotation?: number }>,
): ShapeSelection {
  return selectionOf(
    entries.map((entry, index) =>
      createShape(entry.id, entry, { selectionIndex: index }),
    ),
  );
}

export function getBounds(shape: SelectedShape): VisualBounds {
  return shape.visualBounds;
}
