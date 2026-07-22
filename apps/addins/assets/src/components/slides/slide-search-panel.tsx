import { ScreenHeader } from "@/components/asset-browser/screen-header";
import { PowerPointGuard } from "@/components/shell/power-point-guard";
import { useSlideSearchController } from "@/hooks/slides/use-slide-search-controller";

import { SlideSearchView } from "./slide-search-view";
import type { SlideSearchRequest, SlideSearchResponse } from "./types";

interface SlideSearchPanelProps {
  search: (input: SlideSearchRequest) => Promise<SlideSearchResponse>;
}

export function SlideSearchPanel({ search }: SlideSearchPanelProps) {
  const controller = useSlideSearchController(search);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        title="Slides"
        text="Browse and insert slide templates into your presentation."
      />
      <PowerPointGuard powerpointRequired>
        <SlideSearchView controller={controller} />
      </PowerPointGuard>
    </div>
  );
}
