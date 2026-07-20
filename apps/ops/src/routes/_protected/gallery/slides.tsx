import { createFileRoute } from "@tanstack/react-router";

import { GalleryPlaceholderPage } from "@/features/gallery/gallery-placeholder-page";

export const Route = createFileRoute("/_protected/gallery/slides")({
  component: SlidesPage,
});

function SlidesPage() {
  return (
    <GalleryPlaceholderPage
      title="Slides"
      description="Manage global slide templates available in the add-in gallery"
    />
  );
}
