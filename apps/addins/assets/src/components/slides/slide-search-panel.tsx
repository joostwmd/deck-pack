import { PowerPointGuard } from "@/components/shell/power-point-guard";

import { SlideSearchView } from "./slide-search-view";
import type { SlideSearchRequest, SlideSearchResponse } from "./types";
import { useSlideSearchController } from "@/hooks/slides/use-slide-search-controller";

interface SlideSearchPanelProps {
  search: (input: SlideSearchRequest) => Promise<SlideSearchResponse>;
}

export function SlideSearchPanel({ search }: SlideSearchPanelProps) {
  const controller = useSlideSearchController(search);

  return (
    <PowerPointGuard powerpointRequired>
      <SlideSearchView controller={controller} />
    </PowerPointGuard>
  );
}
