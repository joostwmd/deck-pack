import type {
  DistributeAxis,
  FormattingActionId,
  FormattingCommand,
  ShapeSelection,
} from "../types";
import {
  composePolicies,
  evaluateApplicability,
  minShapes,
  supportsBoundsMutation,
} from "../policies";
import { sortShapesHorizontally, sortShapesVertically } from "../geometry/sort";
import { applyVisualLeft, applyVisualTop, createPositionMutations } from "./mutation-utils";

const DISTRIBUTE_POLICY = composePolicies(minShapes(3), supportsBoundsMutation);

function createDistributePlan(selection: ShapeSelection, axis: DistributeAxis) {
  const sorted =
    axis === "horizontal"
      ? sortShapesHorizontally(selection.shapes)
      : sortShapesVertically(selection.shapes);

  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();

  if (axis === "horizontal") {
    const spanStart = first.visualBounds.left;
    const spanEnd = last.visualBounds.left + last.visualBounds.width;
    const totalSize = sorted.reduce((sum, shape) => sum + shape.visualBounds.width, 0);
    const gap = (spanEnd - spanStart - totalSize) / (sorted.length - 1);
    let cursor = spanStart;

    for (const shape of sorted) {
      nextBounds.set(shape.id, applyVisualLeft(shape, cursor));
      cursor += shape.visualBounds.width + gap;
    }
  } else {
    const spanStart = first.visualBounds.top;
    const spanEnd = last.visualBounds.top + last.visualBounds.height;
    const totalSize = sorted.reduce((sum, shape) => sum + shape.visualBounds.height, 0);
    const gap = (spanEnd - spanStart - totalSize) / (sorted.length - 1);
    let cursor = spanStart;

    for (const shape of sorted) {
      nextBounds.set(shape.id, applyVisualTop(shape, cursor));
      cursor += shape.visualBounds.height + gap;
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export function createDistributeCommand(axis: DistributeAxis): FormattingCommand {
  const id = `distribute-${axis}` as FormattingActionId;

  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, DISTRIBUTE_POLICY),
    createPlan: (selection) => createDistributePlan(selection, axis),
  };
}

export const distributeHorizontalCommand = createDistributeCommand("horizontal");
export const distributeVerticalCommand = createDistributeCommand("vertical");

export const distributeCommands = [distributeHorizontalCommand, distributeVerticalCommand];
