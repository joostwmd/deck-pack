import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/features/gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/gallery/slides/")({
  component: SlidesListPage,
});

function SlidesListPage() {
  return <GalleryListPanel assetClass="slide" />;
}
