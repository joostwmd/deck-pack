import { SlideSearchPanel } from "@/features/slides/slide-search-panel";
import { trpcClient } from "@/utils/trpc";

export function SlidesPanel() {
  return (
    <SlideSearchPanel
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
