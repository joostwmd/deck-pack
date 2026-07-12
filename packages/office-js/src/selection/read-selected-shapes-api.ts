import type { ShapeSelection } from "@deck-pack/presentation-formatting";

import { runPowerPoint } from "../utils";
import { readSelectedShapesFromContext } from "./read-selected-shapes";

export async function readSelectedShapes(): Promise<ShapeSelection> {
  return runPowerPoint((context) => readSelectedShapesFromContext(context));
}

export { readSelectedShapesFromContext, mapOfficeSelection, mapOfficeShapeToSelectedShape } from "./read-selected-shapes";
export type { PowerPointShapeProxy } from "./read-selected-shapes";
