import type { AnyFormattingCommand } from "@deck-pack/presentation-formatting";

import { FormattingUnavailableError } from "./formatting-errors";
import { applyShapeMutationsInContext } from "./apply-shape-mutations";
import { readSelectedShapesFromContext } from "../selection/read-selected-shapes";

export type FormattingExecutionResult = {
  commandId: string;
  mutationCount: number;
};

export async function executeFormattingCommand(
  run: <T>(callback: (context: PowerPoint.RequestContext) => Promise<T>) => Promise<T>,
  command: AnyFormattingCommand,
  params: unknown,
): Promise<FormattingExecutionResult> {
  return run(async (context) => {
    const selection = await readSelectedShapesFromContext(context);
    const applicability = command.evaluate(selection, params);

    if (!applicability.applicable) {
      throw new FormattingUnavailableError(applicability.code, applicability.reason);
    }

    const plan = command.createPlan(selection, params);
    const selectedIds = new Set(selection.shapes.map((shape) => shape.id));
    await applyShapeMutationsInContext(context, selectedIds, plan);

    return {
      commandId: command.id,
      mutationCount: plan.length,
    };
  });
}
