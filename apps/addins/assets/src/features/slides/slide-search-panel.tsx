import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { PowerPointGuard } from "@/components/power-point-guard";

import { SlideSearchView } from "./slide-search-view";
import type { SlideSearchRequest, SlideSearchResponse } from "./types";
import { useSlideSearchController } from "./use-slide-search-controller";

interface SlideSearchPanelProps {
  search: (input: SlideSearchRequest) => Promise<SlideSearchResponse>;
}

export function SlideSearchPanel({ search }: SlideSearchPanelProps) {
  const controller = useSlideSearchController(search);

  return (
    <div className="flex flex-1 flex-col">
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
