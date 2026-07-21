import type {
  FormattingActionId,
  GapParams,
  SetBoundsParams,
} from "@deck-pack/presentation-formatting";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { usePowerPointSelection } from "@/hooks/use-powerpoint-selection";
import { runFormattingCommand } from "@/lib/run-formatting-command";
import { useServices } from "@/services/services-context";

export function useFormatPanelController() {
  const { office } = useServices();
  const { selection, applicableCommands, refresh, isRefreshing, state } = usePowerPointSelection();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const applicabilityById = useMemo(
    () => new Map(applicableCommands.map((entry) => [entry.id, entry.applicability])),
    [applicableCommands],
  );

  const runAction = async (commandId: FormattingActionId, params?: GapParams | SetBoundsParams) => {
    setBusyActionId(commandId);

    try {
      const result = await runFormattingCommand(office, commandId, params);
      if (!result.ok) {
        toast.error(result.reason);
        return;
      }

      toast.success(
        result.mutationCount > 0
          ? `Applied ${commandId.replaceAll("-", " ")} to ${result.mutationCount} object${result.mutationCount === 1 ? "" : "s"}.`
          : "Selection already matched the requested formatting.",
      );
      await refresh();
    } finally {
      setBusyActionId(null);
    }
  };

  return {
    selection,
    applicabilityById,
    busyActionId,
    isRefreshing,
    state,
    refresh,
    runAction,
  };
}

export type FormatPanelController = ReturnType<typeof useFormatPanelController>;
