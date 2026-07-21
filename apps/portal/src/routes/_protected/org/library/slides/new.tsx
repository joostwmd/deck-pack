import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/domains/gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/org/library/slides/new")({
  component: SlidesNewPage,
});

function SlidesNewPage() {
  return <GalleryNewPanel assetClass="slide" />;
}
