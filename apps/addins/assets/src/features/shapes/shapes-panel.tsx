import { ShapeLibraryPanel } from "@/features/shapes/shape-library-panel";
import type { AssetPanelMode } from "@/lib/asset-types";
import { trpcClient } from "@/utils/trpc";

interface ShapesPanelProps {
  mode: AssetPanelMode;
}

export function ShapesPanel({ mode }: ShapesPanelProps) {
  return (
    <ShapeLibraryPanel
      mode={mode}
      search={({ category }) =>
        trpcClient.addin.shapes.search.query({
          category,
        })
      }
    />
  );
}
