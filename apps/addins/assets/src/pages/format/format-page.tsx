import { MIN_TEXT_API } from "@deck-pack/office-js";

import { FormatPanelView } from "@/components/format/format-panel-view";
import { useFormatPanelController } from "@/hooks/format/use-format-panel-controller";

export function FormatPage() {
  const controller = useFormatPanelController();

  return <FormatPanelView minTextApi={MIN_TEXT_API} controller={controller} />;
}
