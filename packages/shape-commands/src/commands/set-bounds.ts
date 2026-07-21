import type { FormattingCommand, SetBoundsParams, ShapeSelection } from "../types";
import {
  composePolicies,
  evaluateApplicability,
  minShapes,
  supportsBoundsMutation,
} from "../policies";
import {
  applyVisualHeight,
  applyVisualLeft,
  applyVisualTop,
  applyVisualWidth,
  createPositionMutations,
} from "./mutation-utils";

const SET_BOUNDS_POLICY = composePolicies(minShapes(1), supportsBoundsMutation);

function validateParams(params: SetBoundsParams) {
  const hasAny =
    params.left != null || params.top != null || params.width != null || params.height != null;

  if (!hasAny) {
    return {
      applicable: false as const,
      code: "missing-bounds",
      reason: "Enter at least one position or size value",
    };
  }

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (!Number.isFinite(value)) {
      return {
        applicable: false as const,
        code: "invalid-bounds",
        reason: `Enter a valid ${key} value`,
      };
    }
  }

  if (params.width != null && params.width <= 0) {
    return {
      applicable: false as const,
      code: "invalid-width",
      reason: "Width must be greater than zero",
    };
  }

  if (params.height != null && params.height <= 0) {
    return {
      applicable: false as const,
      code: "invalid-height",
      reason: "Height must be greater than zero",
    };
  }

  return { applicable: true as const };
}

function createSetBoundsPlan(selection: ShapeSelection, params: SetBoundsParams) {
  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();

  for (const shape of selection.shapes) {
    let next = shape.rawBounds;

    if (params.left != null) {
      next = applyVisualLeft({ ...shape, rawBounds: next }, params.left);
    }

    if (params.top != null) {
      next = applyVisualTop({ ...shape, rawBounds: next }, params.top);
    }

    if (params.width != null) {
      next = applyVisualWidth({ ...shape, rawBounds: next }, params.width);
    }

    if (params.height != null) {
      next = applyVisualHeight({ ...shape, rawBounds: next }, params.height);
    }

    nextBounds.set(shape.id, next);
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export const setBoundsCommand: FormattingCommand<SetBoundsParams> = {
  id: "set-bounds",
  evaluate: (selection, params) => {
    const policyResult = evaluateApplicability(selection, SET_BOUNDS_POLICY);
    if (!policyResult.applicable) {
      return policyResult;
    }

    return validateParams(params ?? {});
  },
  createPlan: (selection, params) => createSetBoundsPlan(selection, params ?? {}),
};
