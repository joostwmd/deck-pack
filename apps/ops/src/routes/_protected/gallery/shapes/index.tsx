import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/domains/gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/gallery/shapes/")({
  component: ShapesListPage,
});

function ShapesListPage() {
  return <GalleryListPanel assetClass="shape" />;
}
