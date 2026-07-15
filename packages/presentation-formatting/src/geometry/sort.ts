import type { SelectedShape } from "../types";

export type SortAxis = "left" | "top" | "right" | "bottom";

function compareByAxis(a: SelectedShape, b: SelectedShape, axis: SortAxis): number {
  const boundsA = a.visualBounds;
  const boundsB = b.visualBounds;

  switch (axis) {
    case "left":
      return boundsA.left - boundsB.left;
    case "top":
      return boundsA.top - boundsB.top;
    case "right":
      return boundsA.left + boundsA.width - (boundsB.left + boundsB.width);
    case "bottom":
      return boundsA.top + boundsA.height - (boundsB.top + boundsB.height);
  }
}

export function sortShapesByAxis(shapes: SelectedShape[], axis: SortAxis): SelectedShape[] {
  return [...shapes].sort((left, right) => {
    const axisComparison = compareByAxis(left, right, axis);
    if (axisComparison !== 0) {
      return axisComparison;
    }

    return left.selectionIndex - right.selectionIndex;
  });
}

export function sortShapesHorizontally(shapes: SelectedShape[]): SelectedShape[] {
  return sortShapesByAxis(shapes, "left");
}

export function sortShapesVertically(shapes: SelectedShape[]): SelectedShape[] {
  return sortShapesByAxis(shapes, "top");
}
