import type { FormattingActionId, FormattingCommand, StackAnchor, StackDirection, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, minShapes, supportsBoundsMutation } from "../policies";
import { sortShapesHorizontally, sortShapesVertically } from "../geometry/sort";
import { applyVisualLeft, applyVisualTop, createPositionMutations } from "./mutation-utils";

const STACK_POLICY = composePolicies(minShapes(2), supportsBoundsMutation);

function createStackPlan(selection: ShapeSelection, direction: StackDirection, anchor: StackAnchor) {
  const sorted =
    direction === "horizontal"
      ? sortShapesHorizontally(selection.shapes)
      : sortShapesVertically(selection.shapes);

  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();

  if (anchor === "leading") {
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
  } else {
    const anchorShape = sorted[sorted.length - 1]!;

    if (direction === "horizontal") {
      let cursorRight = anchorShape.visualBounds.left + anchorShape.visualBounds.width;

      for (let index = sorted.length - 1; index >= 0; index -= 1) {
        const shape = sorted[index]!;
        const nextLeft = cursorRight - shape.visualBounds.width;
        nextBounds.set(shape.id, applyVisualLeft(shape, nextLeft));
        cursorRight = nextLeft;
      }
    } else {
      let cursorBottom = anchorShape.visualBounds.top + anchorShape.visualBounds.height;

      for (let index = sorted.length - 1; index >= 0; index -= 1) {
        const shape = sorted[index]!;
        const nextTop = cursorBottom - shape.visualBounds.height;
        nextBounds.set(shape.id, applyVisualTop(shape, nextTop));
        cursorBottom = nextTop;
      }
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export function createStackCommand(
  id: FormattingActionId,
  direction: StackDirection,
  anchor: StackAnchor,
): FormattingCommand {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, STACK_POLICY),
    createPlan: (selection) => createStackPlan(selection, direction, anchor),
  };
}

export const stackHorizontalCommand = createStackCommand("stack-horizontal", "horizontal", "leading");
export const stackVerticalCommand = createStackCommand("stack-vertical", "vertical", "leading");
export const stackBottomCommand = createStackCommand("stack-bottom", "vertical", "trailing");
export const stackRightCommand = createStackCommand("stack-right", "horizontal", "trailing");

export const stackCommands = [
  stackHorizontalCommand,
  stackVerticalCommand,
  stackBottomCommand,
  stackRightCommand,
];
