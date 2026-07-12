import type { RawBounds, SelectedShape, ShapeSelection, VisualBounds } from "../types";
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
      isLine,
    },
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
