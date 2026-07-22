import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/domains/gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/org/gallery/slides/")({
  component: SlidesListPage,
});

function SlidesListPage() {
  return <GalleryListPanel assetClass="slide" />;
}
