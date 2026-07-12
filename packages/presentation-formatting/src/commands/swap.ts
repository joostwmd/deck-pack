import type { FormattingCommand, ShapeSelection } from "../types";
import { composePolicies, evaluateApplicability, exactShapes, supportsBoundsMutation } from "../policies";
import { getVisualCenter, moveVisualCenterTo } from "../geometry/bounds";
import { createPositionMutations } from "./mutation-utils";

const SWAP_POLICY = composePolicies(exactShapes(2), supportsBoundsMutation);

function createSwapPlan(selection: ShapeSelection) {
  const [first, second] = selection.shapes;
  const firstCenter = getVisualCenter(first!.rawBounds);
  const secondCenter = getVisualCenter(second!.rawBounds);

  const nextBounds = new Map([
    [first!.id, moveVisualCenterTo(first!.rawBounds, secondCenter.x, secondCenter.y)],
    [second!.id, moveVisualCenterTo(second!.rawBounds, firstCenter.x, firstCenter.y)],
  ]);

  return createPositionMutations(selection.shapes, nextBounds);
}

export const swapPositionsCommand: FormattingCommand = {
  id: "swap-positions",
  evaluate: (selection) => evaluateApplicability(selection, SWAP_POLICY),
  createPlan: (selection) => createSwapPlan(selection),
};
