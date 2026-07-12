import type { FormattingActionId, FormattingCommand, GapDirection, GapParams, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, minShapes, supportsBoundsMutation } from "../policies";
import { sortShapesHorizontally, sortShapesVertically } from "../geometry/sort";
import { applyVisualLeft, applyVisualTop, createPositionMutations } from "./mutation-utils";

const GAP_POLICY = composePolicies(minShapes(2), supportsBoundsMutation);

function getMeanAdjacentGap(sorted: ShapeSelection["shapes"], direction: GapDirection): number {
  if (sorted.length < 2) return 0;

  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;

    if (direction === "horizontal") {
      gaps.push(current.visualBounds.left - (previous.visualBounds.left + previous.visualBounds.width));
    } else {
      gaps.push(current.visualBounds.top - (previous.visualBounds.top + previous.visualBounds.height));
    }
  }

  return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
}

function createGapPlan(selection: ShapeSelection, params: GapParams) {
  const sorted =
    params.direction === "horizontal"
      ? sortShapesHorizontally(selection.shapes)
      : sortShapesVertically(selection.shapes);

  let gap = 0;
  if (params.mode === "exact") {
    gap = Math.max(0, params.value ?? 0);
  } else {
    const currentGap = getMeanAdjacentGap(sorted, params.direction);
    const delta = params.value ?? 12;
    gap = Math.max(0, params.mode === "increase" ? currentGap + delta : currentGap - delta);
  }

  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();
  const anchor = sorted[0]!;
  let cursorLeft = anchor.visualBounds.left;
  let cursorTop = anchor.visualBounds.top;

  for (const shape of sorted) {
    if (params.direction === "horizontal") {
      nextBounds.set(shape.id, applyVisualLeft(shape, cursorLeft));
      cursorLeft += shape.visualBounds.width + gap;
    } else {
      nextBounds.set(shape.id, applyVisualTop(shape, cursorTop));
      cursorTop += shape.visualBounds.height + gap;
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

function resolveGapParams(defaultParams: GapParams, commandParams?: GapParams): GapParams {
  if (commandParams == null) {
    return defaultParams;
  }

  return { ...defaultParams, ...commandParams };
}

export function createGapCommand(id: FormattingActionId, defaultParams: GapParams): FormattingCommand<GapParams> {
  return {
    id,
    evaluate: (selection, commandParams) => {
      const params = resolveGapParams(defaultParams, commandParams);
      const applicability = evaluateApplicability(selection, GAP_POLICY);
      if (!applicability.applicable) {
        return applicability;
      }

      if (params.mode === "exact" && (params.value == null || !Number.isFinite(params.value))) {
        return {
          applicable: false,
          code: "invalid-gap",
          reason: "Enter a valid gap value",
        };
      }

      return { applicable: true };
    },
    createPlan: (selection, commandParams) => createGapPlan(selection, resolveGapParams(defaultParams, commandParams)),
  };
}

export const gapExactHorizontalCommand = createGapCommand("gap-exact-horizontal", {
  mode: "exact",
  direction: "horizontal",
});
export const gapExactVerticalCommand = createGapCommand("gap-exact-vertical", {
  mode: "exact",
  direction: "vertical",
});
export const gapIncreaseHorizontalCommand = createGapCommand("gap-increase-horizontal", {
  mode: "increase",
  direction: "horizontal",
  value: 12,
});
export const gapDecreaseHorizontalCommand = createGapCommand("gap-decrease-horizontal", {
  mode: "decrease",
  direction: "horizontal",
  value: 12,
});
export const gapIncreaseVerticalCommand = createGapCommand("gap-increase-vertical", {
  mode: "increase",
  direction: "vertical",
  value: 12,
});
export const gapDecreaseVerticalCommand = createGapCommand("gap-decrease-vertical", {
  mode: "decrease",
  direction: "vertical",
  value: 12,
});

export const gapCommands = [
  gapExactHorizontalCommand,
  gapExactVerticalCommand,
  gapIncreaseHorizontalCommand,
  gapDecreaseHorizontalCommand,
  gapIncreaseVerticalCommand,
  gapDecreaseVerticalCommand,
];
