import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/domains/gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/gallery/shapes/new")({
  component: ShapesNewPage,
});

function ShapesNewPage() {
  return <GalleryNewPanel assetClass="shape" />;
}
