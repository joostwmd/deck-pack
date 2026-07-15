import type { AlignMode, FormattingActionId, FormattingCommand, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, minShapes, supportsBoundsMutation } from "../policies";
import { getSelectionBounds } from "./mutation-utils";
import { applyVisualLeft, applyVisualTop, createPositionMutations } from "./mutation-utils";

const ALIGN_POLICY = composePolicies(minShapes(2), supportsBoundsMutation);

function createAlignmentPlan(selection: ShapeSelection, mode: AlignMode) {
  const bounds = getSelectionBounds(selection.shapes);
  const nextBounds = new Map<string, ReturnType<typeof applyVisualLeft>>();

  for (const shape of selection.shapes) {
    switch (mode) {
      case "left":
        nextBounds.set(shape.id, applyVisualLeft(shape, bounds.left));
        break;
      case "center":
        nextBounds.set(
          shape.id,
          applyVisualLeft(shape, bounds.left + bounds.width / 2 - shape.visualBounds.width / 2),
        );
        break;
      case "right":
        nextBounds.set(
          shape.id,
          applyVisualLeft(shape, bounds.left + bounds.width - shape.visualBounds.width),
        );
        break;
      case "top":
        nextBounds.set(shape.id, applyVisualTop(shape, bounds.top));
        break;
      case "middle":
        nextBounds.set(
          shape.id,
          applyVisualTop(shape, bounds.top + bounds.height / 2 - shape.visualBounds.height / 2),
        );
        break;
      case "bottom":
        nextBounds.set(
          shape.id,
          applyVisualTop(shape, bounds.top + bounds.height - shape.visualBounds.height),
        );
        break;
    }
  }

  return createPositionMutations(selection.shapes, nextBounds);
}

export function createAlignCommand(mode: AlignMode): FormattingCommand {
  const id = `align-${mode}` as FormattingActionId;

  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, ALIGN_POLICY),
    createPlan: (selection) => createAlignmentPlan(selection, mode),
  };
}

export const alignLeftCommand = createAlignCommand("left");
export const alignCenterCommand = createAlignCommand("center");
export const alignRightCommand = createAlignCommand("right");
export const alignTopCommand = createAlignCommand("top");
export const alignMiddleCommand = createAlignCommand("middle");
export const alignBottomCommand = createAlignCommand("bottom");

export const alignCommands = [
  alignLeftCommand,
  alignCenterCommand,
  alignRightCommand,
  alignTopCommand,
  alignMiddleCommand,
  alignBottomCommand,
];
