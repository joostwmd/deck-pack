import { ShapeLibraryPanel } from "@/features/shapes/shape-library-panel";
import { trpcClient } from "@/utils/trpc";

export function ShapesPanel() {
  return (
    <ShapeLibraryPanel
      search={({ category }) =>
        trpcClient.addin.shapes.search.query({
          category,
        })
      }
    />
  );
}
