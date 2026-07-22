import type { FormattingCommand, RawBounds, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, minShapes, onlyLines } from "../policies";
import { createPositionMutations } from "./mutation-utils";

const RECTIFY_POLICY = composePolicies(minShapes(1), onlyLines);

function createRectifyPlan(selection: ShapeSelection) {
  const nextBounds = new Map<string, RawBounds>();

  for (const shape of selection.shapes) {
    const raw = shape.rawBounds;
    if (raw.width > raw.height) {
      nextBounds.set(shape.id, { ...raw, height: 0 });
    } else {
      nextBounds.set(shape.id, { ...raw, width: 0 });
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export const rectifyLinesCommand: FormattingCommand = {
  id: "rectify-lines",
  evaluate: (selection) => evaluateApplicability(selection, RECTIFY_POLICY),
  createPlan: (selection) => createRectifyPlan(selection),
};
