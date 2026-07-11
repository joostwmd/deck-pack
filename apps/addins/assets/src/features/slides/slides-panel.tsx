import { SlideSearchPanel } from "@/features/slides/slide-search-panel";
import type { AssetPanelMode } from "@/lib/asset-types";
import { trpcClient } from "@/utils/trpc";

interface SlidesPanelProps {
  mode: AssetPanelMode;
}

export function SlidesPanel({ mode }: SlidesPanelProps) {
  return (
    <SlideSearchPanel
      mode={mode}
      search={({ query, filters, sort }) =>
        trpcClient.addin.slides.search.query({
          query,
          category: filters.category,
          tags: filters.tags,
          aspectRatio: filters.aspectRatio,
          sort,
        })
      }
    />
  );
}
