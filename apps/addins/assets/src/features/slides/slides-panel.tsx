import { SlideSearchPanel } from "@/features/slides/slide-search-panel";
import { useServices } from "@/services/services-context";

export function SlidesPanel() {
  const { api } = useServices();

  return (
    <SlideSearchPanel
      search={({ query, filters, sort }) =>
        api.addin.slides.search.query({
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
