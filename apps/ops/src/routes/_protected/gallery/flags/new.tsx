import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/domains/gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/gallery/flags/new")({
  component: FlagsNewPage,
});

function FlagsNewPage() {
  return <GalleryNewPanel assetClass="flag" />;
}
