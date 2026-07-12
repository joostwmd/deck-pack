import type { Applicability, ApplicabilityPolicy, SelectedShape, ShapeSelection } from "./types";

export function composePolicies(...policies: ApplicabilityPolicy[]): ApplicabilityPolicy {
  return (selection) => {
    for (const policy of policies) {
      const result = policy(selection);
      if (!result.applicable) {
        return result;
      }
    }
    return { applicable: true };
  };
}

export function minShapes(minimum: number): ApplicabilityPolicy {
  return (selection) => {
    if (selection.shapes.length >= minimum) {
      return { applicable: true };
    }

    return {
      applicable: false,
      code: "min-shape-count",
      reason:
        minimum === 1
          ? "Select at least one object"
          : `Select at least ${minimum} objects`,
    };
  };
}

export function exactShapes(count: number): ApplicabilityPolicy {
  return (selection) => {
    if (selection.shapes.length === count) {
      return { applicable: true };
    }

    return {
      applicable: false,
      code: "exact-shape-count",
      reason: `Select exactly ${count} objects`,
    };
  };
}

export function allShapes(predicate: (shape: SelectedShape) => boolean, failure: Applicability): ApplicabilityPolicy {
  return (selection) => {
    const unsupported = selection.shapes.find((shape) => !predicate(shape));
    if (!unsupported) {
      return { applicable: true };
    }

    return failure;
  };
}

export const supportsBoundsMutation: ApplicabilityPolicy = allShapes(
  (shape) => shape.capabilities.supportsBoundsMutation,
  {
    applicable: false,
    code: "unsupported-shape-type",
    reason: "One or more selected objects cannot be repositioned",
  },
);

export const supportsResize: ApplicabilityPolicy = allShapes(
  (shape) => shape.capabilities.supportsResize,
  {
    applicable: false,
    code: "unsupported-resize",
    reason: "One or more selected objects cannot be resized",
  },
);

export const onlyLines: ApplicabilityPolicy = allShapes(
  (shape) => shape.capabilities.isLine,
  {
    applicable: false,
    code: "requires-line-shapes",
    reason: "Select one or more line objects",
  },
);

export function sameSlide(): ApplicabilityPolicy {
  return () => ({ applicable: true });
}

export function evaluateApplicability(
  selection: ShapeSelection,
  policy: ApplicabilityPolicy,
): Applicability {
  if (selection.shapes.length === 0) {
    return {
      applicable: false,
      code: "empty-selection",
      reason: "Select one or more objects in PowerPoint",
    };
  }

  return policy(selection);
}
