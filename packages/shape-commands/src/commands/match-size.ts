import type {
  FormattingActionId,
  FormattingCommand,
  MatchSizeMode,
  ShapeSelection,
} from "../types";
import {
  composePolicies,
  evaluateApplicability,
  minShapes,
  supportsBoundsMutation,
  supportsResize,
} from "../policies";
import { applyVisualHeight, applyVisualWidth, createPositionMutations } from "./mutation-utils";

const MATCH_SIZE_POLICY = composePolicies(minShapes(2), supportsBoundsMutation, supportsResize);

function createMatchSizePlan(selection: ShapeSelection, mode: MatchSizeMode) {
  const reference = selection.shapes[0]!;
  const nextBounds = new Map<string, ReturnType<typeof applyVisualWidth>>();

  for (const shape of selection.shapes.slice(1)) {
    let next = shape.rawBounds;

    if (mode === "width" || mode === "both") {
      next = applyVisualWidth({ ...shape, rawBounds: next }, reference.visualBounds.width);
    }

    if (mode === "height" || mode === "both") {
      next = applyVisualHeight({ ...shape, rawBounds: next }, reference.visualBounds.height);
    }

    nextBounds.set(shape.id, next);
  }

  return createPositionMutations(selection.shapes.slice(1), nextBounds);
}

export function createMatchSizeCommand(mode: MatchSizeMode): FormattingCommand {
  const id = `match-${mode === "both" ? "both" : mode}` as FormattingActionId;

  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, MATCH_SIZE_POLICY),
    createPlan: (selection) => createMatchSizePlan(selection, mode),
  };
}

export const matchWidthCommand = createMatchSizeCommand("width");
export const matchHeightCommand = createMatchSizeCommand("height");
export const matchBothCommand = createMatchSizeCommand("both");

export const matchSizeCommands = [matchWidthCommand, matchHeightCommand, matchBothCommand];
