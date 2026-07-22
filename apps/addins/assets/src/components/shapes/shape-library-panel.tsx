import type { ShapeSearchRequest, ShapeSearchResponse } from "./types";
import { ShapeLibraryView } from "./shape-library-view";
import { useShapeLibraryController } from "@/hooks/shapes/use-shape-library-controller";

interface ShapeLibraryPanelProps {
  search: (input: ShapeSearchRequest) => Promise<ShapeSearchResponse>;
}

export function ShapeLibraryPanel({ search }: ShapeLibraryPanelProps) {
  const controller = useShapeLibraryController(search);

  return <ShapeLibraryView controller={controller} />;
}
