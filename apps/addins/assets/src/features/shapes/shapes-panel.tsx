import { ShapeLibraryPanel } from "@/features/shapes/shape-library-panel";
import { useServices } from "@/services/services-context";

export function ShapesPanel() {
  const { api } = useServices();

  return (
    <ShapeLibraryPanel
      search={({ category }) =>
        api.addin.shapes.search.query({
          category,
        })
      }
    />
  );
}
