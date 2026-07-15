import type { Applicability, FormattingActionId, ShapeSelection } from "@deck-pack/presentation-formatting";
import { formattingCommandRegistry } from "@deck-pack/presentation-formatting";
import { readSelectedShapes, subscribeToSelectionChanges, type OfficeContextPort } from "@deck-pack/office-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import { getDefaultCommandParams } from "@/lib/get-default-command-params";

export type SelectionState =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; selection: ShapeSelection }
  | { status: "refreshing"; selection: ShapeSelection }
  | { status: "error"; message: string };

export type CommandApplicability = {
  id: FormattingActionId;
  applicability: Applicability;
};

export function usePowerPointSelection() {
  const { isOfficeAvailable } = useEnvironment();
  const enabled = isOfficeAvailable;
  const [state, setState] = useState<SelectionState>(enabled ? { status: "loading" } : { status: "unavailable" });
  const requestTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ status: "unavailable" });
      return;
    }

    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;

    setState((current) => {
      if (current.status === "ready" || current.status === "refreshing") {
        return { status: "refreshing", selection: current.selection };
      }

      return { status: "loading" };
    });

    try {
      const selection = await readSelectedShapes();
      if (requestTokenRef.current !== requestToken) {
        return;
      }

      if (selection.shapes.length === 0) {
        setState({ status: "empty" });
        return;
      }

      setState({ status: "ready", selection });
    } catch (error) {
      if (requestTokenRef.current !== requestToken) {
        return;
      }

      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to read the current selection.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState({ status: "unavailable" });
      return;
    }

    void refresh();

    const onFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", onFocus);

    let unsubscribe: (() => Promise<void>) | undefined;
    const office = (window as Window & { Office?: typeof Office }).Office;

    if (office?.context?.document) {
      void subscribeToSelectionChanges(office.context as unknown as OfficeContextPort, () => {
        void refresh();
      }).then((subscription) => {
        unsubscribe = subscription.unsubscribe;
      });
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      void unsubscribe?.();
    };
  }, [enabled, refresh]);

  const applicableCommands = useMemo<CommandApplicability[]>(() => {
    if (state.status !== "ready" && state.status !== "refreshing") {
      return [];
    }

    return formattingCommandRegistry.map((command) => ({
      id: command.id,
      applicability: (
        command as { evaluate: (selection: ShapeSelection, params: unknown) => Applicability }
      ).evaluate(state.selection, getDefaultCommandParams(command.id)),
    }));
  }, [state]);

  const selection = state.status === "ready" || state.status === "refreshing" ? state.selection : null;

  return {
    state,
    selection,
    applicableCommands,
    refresh,
    isRefreshing: state.status === "refreshing" || state.status === "loading",
  };
}
