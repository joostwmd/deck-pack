import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/features/library-gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/org/library/flags/")({
  component: FlagsListPage,
});

function FlagsListPage() {
  return <GalleryListPanel assetClass="flag" />;
}
