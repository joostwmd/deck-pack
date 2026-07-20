import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/features/library-gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/org/library/shapes/new")({
  component: ShapesNewPage,
});

function ShapesNewPage() {
  return <GalleryNewPanel assetClass="shape" />;
}
