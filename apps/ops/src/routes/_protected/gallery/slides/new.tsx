import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/domains/gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/gallery/slides/new")({
  component: SlidesNewPage,
});

function SlidesNewPage() {
  return <GalleryNewPanel assetClass="slide" />;
}
