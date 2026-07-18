import { ShapeLibraryPanel } from "@/components/shapes/shape-library-panel";
import { useServices } from "@/services/services-context";

export function ShapesPage() {
  const { assets } = useServices();

  return (
    <ShapeLibraryPanel
      search={({ category }) =>
        assets.shapes.search({
          category,
        })
      }
    />
  );
}
