import { getPowerPointCapabilitySummary, MIN_TEXT_API } from "@deck-pack/office-js";
import { useMemo } from "react";

import { CheckPanelView } from "@/features/check/check-panel-view";
import { useCheckPanelController } from "@/features/check/use-check-panel-controller";

export function CheckPanel() {
  const controller = useCheckPanelController();
  const capabilitySummary = useMemo(() => getPowerPointCapabilitySummary(), []);
  const capabilitySummaryText = capabilitySummary.highest
    ? `PowerPoint API support: ${capabilitySummary.supported.join(", ")}`
    : null;

  return (
    <CheckPanelView
      minTextApi={MIN_TEXT_API}
      capabilitySummaryText={capabilitySummaryText}
      controller={controller}
    />
  );
}
