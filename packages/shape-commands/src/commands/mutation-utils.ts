import type { SelectedShape, ShapeMutation } from "../types";
import { GEOMETRY_EPSILON } from "../types";
import {
  getSelectionVisualBounds,
  getVisualBounds,
  rawBoundsToMutation,
  setVisualHeight,
  setVisualLeft,
  setVisualTop,
  setVisualWidth,
} from "../geometry/bounds";

export function createPositionMutations(
  shapes: SelectedShape[],
  nextBounds: Map<string, ReturnType<typeof setVisualLeft>>,
): ShapeMutation[] {
  const mutations: ShapeMutation[] = [];

  for (const shape of shapes) {
    const after = nextBounds.get(shape.id);
    if (!after) continue;

    const mutation = rawBoundsToMutation(shape.id, shape.rawBounds, after, GEOMETRY_EPSILON);
    if (mutation) {
      mutations.push(mutation);
    }
  }

  return mutations;
}

export function applyVisualLeft(shape: SelectedShape, left: number) {
  return setVisualLeft(shape.rawBounds, left);
}

export function applyVisualTop(shape: SelectedShape, top: number) {
  return setVisualTop(shape.rawBounds, top);
}

export function applyVisualWidth(shape: SelectedShape, width: number) {
  return setVisualWidth(shape.rawBounds, width);
}

export function applyVisualHeight(shape: SelectedShape, height: number) {
  return setVisualHeight(shape.rawBounds, height);
}

export function getSharedValue(values: number[], epsilon = GEOMETRY_EPSILON): number | null {
  if (values.length === 0) return null;
  const [first, ...rest] = values;
  return rest.every((value) => Math.abs(value - first!) <= epsilon) ? first! : null;
}

export function refreshVisualBounds(shape: SelectedShape): SelectedShape {
  return {
    ...shape,
    visualBounds: getVisualBounds(shape.rawBounds),
  };
}

export function getSelectionBounds(shapes: SelectedShape[]) {
  return getSelectionVisualBounds(shapes);
}
