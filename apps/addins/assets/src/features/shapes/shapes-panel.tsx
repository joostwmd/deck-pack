import { ShapeLibraryPanel } from "@/features/shapes/shape-library-panel";
import { useServices } from "@/services/services-context";

export function ShapesPanel() {
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
