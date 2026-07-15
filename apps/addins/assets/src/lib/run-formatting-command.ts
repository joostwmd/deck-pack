import type { AnyFormattingCommand, FormattingActionId } from "@deck-pack/presentation-formatting";
import { getFormattingCommandById } from "@deck-pack/presentation-formatting";
import {
  executeFormattingCommand,
  FormattingUnavailableError,
  runPowerPoint,
} from "@deck-pack/office-js";

import { getDefaultCommandParams } from "./get-default-command-params";

export type FormattingCommandResult =
  | { ok: true; commandId: FormattingActionId; mutationCount: number }
  | { ok: false; code: string; reason: string };

export async function runFormattingCommand<TParams>(
  commandId: FormattingActionId,
  params?: TParams,
): Promise<FormattingCommandResult> {
  const command = getFormattingCommandById(commandId);

  if (!command) {
    return {
      ok: false,
      code: "unknown-command",
      reason: "This formatting action is not available.",
    };
  }

  const resolvedParams = (params ?? getDefaultCommandParams(commandId)) as TParams;

  try {
    const result = await executeFormattingCommand(runPowerPoint, command as AnyFormattingCommand, resolvedParams);
    return {
      ok: true,
      commandId: result.commandId as FormattingActionId,
      mutationCount: result.mutationCount,
    };
  } catch (error) {
    if (error instanceof FormattingUnavailableError) {
      return {
        ok: false,
        code: error.code,
        reason: error.reason,
      };
    }

    return {
      ok: false,
      code: "execution-failed",
      reason: error instanceof Error ? error.message : "Formatting action failed.",
    };
  }
}
