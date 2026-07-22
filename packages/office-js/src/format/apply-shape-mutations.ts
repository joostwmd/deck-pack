import type { ShapeMutation } from "@deck-pack/shape-commands";

import {
  mapDomainAutoSizeToOffice,
  mapDomainVerticalAlignmentToOffice,
} from "./text-frame-mappers";

export type MutableTextFrameProxy = {
  autoSizeSetting: string;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  wordWrap: boolean;
  verticalAlignment: string;
  text: string;
};

export type MutableShapeProxy = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation?: number;
  textFrame?: MutableTextFrameProxy;
};

function applyTextMutation(textFrame: MutableTextFrameProxy, mutation: ShapeMutation): void {
  if (mutation.autoSizeSetting != null) {
    textFrame.autoSizeSetting = mapDomainAutoSizeToOffice(mutation.autoSizeSetting);
  }
  if (mutation.leftMargin != null) textFrame.leftMargin = mutation.leftMargin;
  if (mutation.rightMargin != null) textFrame.rightMargin = mutation.rightMargin;
  if (mutation.topMargin != null) textFrame.topMargin = mutation.topMargin;
  if (mutation.bottomMargin != null) textFrame.bottomMargin = mutation.bottomMargin;
  if (mutation.wordWrap != null) textFrame.wordWrap = mutation.wordWrap;
  if (mutation.verticalAlignment != null) {
    textFrame.verticalAlignment = mapDomainVerticalAlignmentToOffice(mutation.verticalAlignment);
  }
  if (mutation.text != null) textFrame.text = mutation.text;
}

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

    if (shape.textFrame) {
      applyTextMutation(shape.textFrame, mutation);
    }
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

    const hasTextMutation =
      mutation.autoSizeSetting != null ||
      mutation.leftMargin != null ||
      mutation.rightMargin != null ||
      mutation.topMargin != null ||
      mutation.bottomMargin != null ||
      mutation.wordWrap != null ||
      mutation.verticalAlignment != null ||
      mutation.text != null;

    if (hasTextMutation) {
      const textFrame = shape.textFrame;
      if (mutation.autoSizeSetting != null) {
        textFrame.autoSizeSetting = mapDomainAutoSizeToOffice(
          mutation.autoSizeSetting,
        ) as PowerPoint.ShapeAutoSize;
      }
      if (mutation.leftMargin != null) textFrame.leftMargin = mutation.leftMargin;
      if (mutation.rightMargin != null) textFrame.rightMargin = mutation.rightMargin;
      if (mutation.topMargin != null) textFrame.topMargin = mutation.topMargin;
      if (mutation.bottomMargin != null) textFrame.bottomMargin = mutation.bottomMargin;
      if (mutation.wordWrap != null) textFrame.wordWrap = mutation.wordWrap;
      if (mutation.verticalAlignment != null) {
        textFrame.verticalAlignment = mapDomainVerticalAlignmentToOffice(
          mutation.verticalAlignment,
        ) as PowerPoint.TextVerticalAlignment;
      }
      if (mutation.text != null) textFrame.textRange.text = mutation.text;
    }
  }

  await context.sync();
}
