import { createFileRoute } from "@tanstack/react-router";

import { GalleryNewPanel } from "@/features/library-gallery/gallery-new-panel";

export const Route = createFileRoute("/_protected/org/library/flags/new")({
  component: FlagsNewPage,
});

function FlagsNewPage() {
  return <GalleryNewPanel assetClass="flag" />;
}
