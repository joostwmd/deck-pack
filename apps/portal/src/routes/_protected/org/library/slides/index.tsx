import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/features/library-gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/org/library/slides/")({
  component: SlidesListPage,
});

function SlidesListPage() {
  return <GalleryListPanel assetClass="slide" />;
}
