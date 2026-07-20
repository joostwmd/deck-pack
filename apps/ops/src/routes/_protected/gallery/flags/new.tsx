import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/features/gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/gallery/flags/new")({
  component: FlagsNewPage,
});

function FlagsNewPage() {
  return <GalleryNewPanel assetClass="flag" />;
}
