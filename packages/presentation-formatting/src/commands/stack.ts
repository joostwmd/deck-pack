import type { FormattingActionId, FormattingCommand, StackDirection, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, minShapes, supportsBoundsMutation } from "../policies";
import { sortShapesHorizontally, sortShapesVertically } from "../geometry/sort";
import { applyVisualLeft, applyVisualTop, createPositionMutations } from "./mutation-utils";

const STACK_POLICY = composePolicies(minShapes(2), supportsBoundsMutation);

function createStackPlan(selection: ShapeSelection, direction: StackDirection) {
  const sorted =
    direction === "horizontal"
      ? sortShapesHorizontally(selection.shapes)
      : sortShapesVertically(selection.shapes);

  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();
  let cursorLeft = sorted[0]!.visualBounds.left;
  let cursorTop = sorted[0]!.visualBounds.top;

  for (const shape of sorted) {
    if (direction === "horizontal") {
      nextBounds.set(shape.id, applyVisualLeft(shape, cursorLeft));
      cursorLeft += shape.visualBounds.width;
    } else {
      nextBounds.set(shape.id, applyVisualTop(shape, cursorTop));
      cursorTop += shape.visualBounds.height;
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export function createStackCommand(direction: StackDirection): FormattingCommand {
  const id = (`stack-${direction}`) as FormattingActionId;

  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, STACK_POLICY),
    createPlan: (selection) => createStackPlan(selection, direction),
  };
}

export const stackHorizontalCommand = createStackCommand("horizontal");
export const stackVerticalCommand = createStackCommand("vertical");

export const stackCommands = [stackHorizontalCommand, stackVerticalCommand];
