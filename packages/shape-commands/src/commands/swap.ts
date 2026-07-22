import type {
  FormattingActionId,
  FormattingCommand,
  ShapeSelection,
  SwapAnchor,
  SwapParams,
} from "../types";
import {
  composePolicies,
  evaluateApplicability,
  exactShapes,
  supportsBoundsMutation,
} from "../policies";
import {
  getVisualCenter,
  moveVisualCenterTo,
  setVisualLeft,
  setVisualTop,
} from "../geometry/bounds";
import { createPositionMutations } from "./mutation-utils";

const SWAP_POLICY = composePolicies(exactShapes(2), supportsBoundsMutation);

function resolveSwapParams(defaultParams: SwapParams, commandParams?: SwapParams): SwapParams {
  if (commandParams == null) {
    return defaultParams;
  }

  return { ...defaultParams, ...commandParams };
}

function createSwapPlan(selection: ShapeSelection, anchor: SwapAnchor) {
  const [first, second] = selection.shapes;
  const firstBounds = first!.visualBounds;
  const secondBounds = second!.visualBounds;

  const firstCenter = getVisualCenter(first!.rawBounds);
  const secondCenter = getVisualCenter(second!.rawBounds);

  const firstTop = firstBounds.top;
  const secondTop = secondBounds.top;
  const firstLeft = firstBounds.left;
  const secondLeft = secondBounds.left;
  const firstBottom = firstBounds.top + firstBounds.height;
  const secondBottom = secondBounds.top + secondBounds.height;
  const firstRight = firstBounds.left + firstBounds.width;
  const secondRight = secondBounds.left + secondBounds.width;

  let firstNext = first!.rawBounds;
  let secondNext = second!.rawBounds;

  switch (anchor) {
    case "center":
      firstNext = moveVisualCenterTo(first!.rawBounds, secondCenter.x, secondCenter.y);
      secondNext = moveVisualCenterTo(second!.rawBounds, firstCenter.x, firstCenter.y);
      break;
    case "top-left":
      firstNext = setVisualTop(setVisualLeft(first!.rawBounds, secondLeft), secondTop);
      secondNext = setVisualTop(setVisualLeft(second!.rawBounds, firstLeft), firstTop);
      break;
    case "top-right":
      firstNext = setVisualTop(
        setVisualLeft(first!.rawBounds, secondRight - firstBounds.width),
        secondTop,
      );
      secondNext = setVisualTop(
        setVisualLeft(second!.rawBounds, firstRight - secondBounds.width),
        firstTop,
      );
      break;
    case "bottom-left":
      firstNext = setVisualTop(
        setVisualLeft(first!.rawBounds, secondLeft),
        secondBottom - firstBounds.height,
      );
      secondNext = setVisualTop(
        setVisualLeft(second!.rawBounds, firstLeft),
        firstBottom - secondBounds.height,
      );
      break;
    case "bottom-right":
      firstNext = setVisualTop(
        setVisualLeft(first!.rawBounds, secondRight - firstBounds.width),
        secondBottom - firstBounds.height,
      );
      secondNext = setVisualTop(
        setVisualLeft(second!.rawBounds, firstRight - secondBounds.width),
        firstBottom - secondBounds.height,
      );
      break;
  }

  const nextBounds = new Map([
    [first!.id, firstNext],
    [second!.id, secondNext],
  ]);

  return createPositionMutations(selection.shapes, nextBounds);
}

export function createSwapCommand(
  id: FormattingActionId,
  defaultParams: SwapParams,
): FormattingCommand<SwapParams> {
  return {
    id,
    evaluate: (selection) => evaluateApplicability(selection, SWAP_POLICY),
    createPlan: (selection, commandParams) =>
      createSwapPlan(selection, resolveSwapParams(defaultParams, commandParams).anchor),
  };
}

export const swapPositionsCommand = createSwapCommand("swap-positions", { anchor: "center" });
export const swapTopLeftCommand = createSwapCommand("swap-top-left", { anchor: "top-left" });
export const swapTopRightCommand = createSwapCommand("swap-top-right", { anchor: "top-right" });
export const swapBottomLeftCommand = createSwapCommand("swap-bottom-left", {
  anchor: "bottom-left",
});
export const swapBottomRightCommand = createSwapCommand("swap-bottom-right", {
  anchor: "bottom-right",
});

export const swapCommands = [
  swapPositionsCommand,
  swapTopLeftCommand,
  swapTopRightCommand,
  swapBottomLeftCommand,
  swapBottomRightCommand,
];
