import type {
  FormattingActionId,
  FormattingCommand,
  SelectedShape,
  ShapeMutation,
  ShapeSelection,
  TextAutoSizeMode,
  TextVerticalAlignmentMode,
} from "../types";
import { composePolicies, evaluateApplicability, exactShapes, minShapes, supportsTextFrame } from "../policies";

const TEXT_POLICY = composePolicies(minShapes(1), supportsTextFrame);
const SWAP_TEXT_POLICY = composePolicies(exactShapes(2), supportsTextFrame);

const MARGIN_DELTA = 6;

function createTextMutation(shapeId: string, mutation: Omit<ShapeMutation, "shapeId">): ShapeMutation {
  return { shapeId, ...mutation };
}

function mapShapesToTextMutations(
  shapes: SelectedShape[],
  mapper: (shape: SelectedShape) => Omit<ShapeMutation, "shapeId">,
): ShapeMutation[] {
  return shapes.map((shape) => createTextMutation(shape.id, mapper(shape)));
}

function createAutoSizePlan(shapes: SelectedShape[], mode: TextAutoSizeMode): ShapeMutation[] {
  return mapShapesToTextMutations(shapes, () => ({ autoSizeSetting: mode }));
}

function createMarginPlan(shapes: SelectedShape[], mode: "remove" | "increase" | "decrease"): ShapeMutation[] {
  return mapShapesToTextMutations(shapes, (shape) => {
    const snapshot = shape.textFrame!;
    const adjust = (value: number) => {
      if (mode === "remove") return 0;
      if (mode === "increase") return value + MARGIN_DELTA;
      return Math.max(0, value - MARGIN_DELTA);
    };

    return {
      leftMargin: adjust(snapshot.leftMargin),
      rightMargin: adjust(snapshot.rightMargin),
      topMargin: adjust(snapshot.topMargin),
      bottomMargin: adjust(snapshot.bottomMargin),
    };
  });
}

function createWordWrapPlan(shapes: SelectedShape[], enabled: boolean): ShapeMutation[] {
  return mapShapesToTextMutations(shapes, () => ({ wordWrap: enabled }));
}

function createVerticalAlignPlan(shapes: SelectedShape[], alignment: TextVerticalAlignmentMode): ShapeMutation[] {
  return mapShapesToTextMutations(shapes, () => ({ verticalAlignment: alignment }));
}

function createSwapTextPlan(selection: ShapeSelection): ShapeMutation[] {
  const [first, second] = selection.shapes;
  const firstText = first!.textFrame?.text ?? "";
  const secondText = second!.textFrame?.text ?? "";

  return [
    createTextMutation(first!.id, { text: secondText }),
    createTextMutation(second!.id, { text: firstText }),
  ];
}

function createAutoSizeCommand(id: FormattingActionId, mode: TextAutoSizeMode): FormattingCommand {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, TEXT_POLICY),
    createPlan: (selection) => createAutoSizePlan(selection.shapes, mode),
  };
}

function createMarginCommand(id: FormattingActionId, mode: "remove" | "increase" | "decrease"): FormattingCommand {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, TEXT_POLICY),
    createPlan: (selection) => createMarginPlan(selection.shapes, mode),
  };
}

function createWordWrapCommand(id: FormattingActionId, enabled: boolean): FormattingCommand {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, TEXT_POLICY),
    createPlan: (selection) => createWordWrapPlan(selection.shapes, enabled),
  };
}

function createVerticalAlignCommand(id: FormattingActionId, alignment: TextVerticalAlignmentMode): FormattingCommand {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, TEXT_POLICY),
    createPlan: (selection) => createVerticalAlignPlan(selection.shapes, alignment),
  };
}

export const textAutofitNoneCommand = createAutoSizeCommand("text-autofit-none", "none");
export const textAutofitShrinkTextCommand = createAutoSizeCommand("text-autofit-shrink-text", "shrink-text");
export const textAutofitResizeShapeCommand = createAutoSizeCommand("text-autofit-resize-shape", "resize-shape");

export const textMarginRemoveCommand = createMarginCommand("text-margin-remove", "remove");
export const textMarginIncreaseCommand = createMarginCommand("text-margin-increase", "increase");
export const textMarginDecreaseCommand = createMarginCommand("text-margin-decrease", "decrease");

export const textWrapOnCommand = createWordWrapCommand("text-wrap-on", true);
export const textWrapOffCommand = createWordWrapCommand("text-wrap-off", false);

export const textVerticalTopCommand = createVerticalAlignCommand("text-vertical-top", "top");
export const textVerticalMiddleCommand = createVerticalAlignCommand("text-vertical-middle", "middle");
export const textVerticalBottomCommand = createVerticalAlignCommand("text-vertical-bottom", "bottom");

export const swapTextCommand: FormattingCommand = {
  id: "swap-text",
  evaluate: (selection) => evaluateApplicability(selection, SWAP_TEXT_POLICY),
  createPlan: (selection) => createSwapTextPlan(selection),
};

export const textCommands = [
  textAutofitNoneCommand,
  textAutofitShrinkTextCommand,
  textAutofitResizeShapeCommand,
  textMarginRemoveCommand,
  textMarginIncreaseCommand,
  textMarginDecreaseCommand,
  textWrapOnCommand,
  textWrapOffCommand,
  textVerticalTopCommand,
  textVerticalMiddleCommand,
  textVerticalBottomCommand,
  swapTextCommand,
];
