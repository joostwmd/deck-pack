import { createFileRoute } from "@tanstack/react-router";

import { GalleryPlaceholderPage } from "@/features/gallery/gallery-placeholder-page";

export const Route = createFileRoute("/_protected/gallery/shapes")({
  component: ShapesPage,
});

function ShapesPage() {
  return (
    <GalleryPlaceholderPage
      title="Shapes"
      description="Manage global shapes available in the add-in gallery"
    />
  );
}
