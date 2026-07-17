import { SlideSearchPanel } from "@/features/slides/slide-search-panel";
import { useServices } from "@/services/services-context";

export function SlidesPanel() {
  const { assets } = useServices();

  return (
    <SlideSearchPanel
      search={({ query, filters, sort }) =>
        assets.slides.search({
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
