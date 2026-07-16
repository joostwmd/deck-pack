import { MIN_TEXT_API } from "@deck-pack/office-js";

import { FormatPanelView } from "@/features/format/format-panel-view";
import { useFormatPanelController } from "@/features/format/use-format-panel-controller";

export function FormatPanel() {
  const controller = useFormatPanelController();

  return <FormatPanelView minTextApi={MIN_TEXT_API} controller={controller} />;
}
