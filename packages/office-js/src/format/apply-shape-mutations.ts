import type { ShapeMutation } from "@deck-pack/presentation-formatting";

export type MutableShapeProxy = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation?: number;
};

export function applyShapeMutations(
  shapesById: Map<string, MutableShapeProxy>,
  mutations: ShapeMutation[],
): void {
  for (const mutation of mutations) {
    const shape = shapesById.get(mutation.shapeId);
    if (!shape) {
      throw new Error(`Cannot apply mutation to unselected shape: ${mutation.shapeId}`);
    }

    if (mutation.left != null) shape.left = mutation.left;
    if (mutation.top != null) shape.top = mutation.top;
    if (mutation.width != null) shape.width = mutation.width;
    if (mutation.height != null) shape.height = mutation.height;
    if (mutation.rotation != null) shape.rotation = mutation.rotation;
  }
}

export async function applyShapeMutationsInContext(
  context: PowerPoint.RequestContext,
  selectionShapeIds: Set<string>,
  mutations: ShapeMutation[],
): Promise<void> {
  if (mutations.length === 0) {
    return;
  }

  const selectedSlides = context.presentation.getSelectedSlides();
  selectedSlides.load("items/id");
  await context.sync();

  const slide = selectedSlides.items[0];
  if (!slide) {
    throw new Error("Select a slide before applying formatting.");
  }

  const shapesById = new Map<string, PowerPoint.Shape>();

  for (const mutation of mutations) {
    if (!selectionShapeIds.has(mutation.shapeId)) {
      throw new Error(`Cannot apply mutation to unselected shape: ${mutation.shapeId}`);
    }

    const shape = slide.shapes.getItem(mutation.shapeId);
    shapesById.set(mutation.shapeId, shape);
  }

  for (const mutation of mutations) {
    const shape = shapesById.get(mutation.shapeId)!;
    if (mutation.left != null) shape.left = mutation.left;
    if (mutation.top != null) shape.top = mutation.top;
    if (mutation.width != null) shape.width = mutation.width;
    if (mutation.height != null) shape.height = mutation.height;
    if (mutation.rotation != null) shape.rotation = mutation.rotation;
  }

  await context.sync();
}
