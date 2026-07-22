import { createFileRoute } from "@tanstack/react-router";

import { GalleryListPanel } from "@/domains/gallery/gallery-list-panel";

export const Route = createFileRoute("/_protected/org/gallery/flags/")({
  component: FlagsListPage,
});

function FlagsListPage() {
  return <GalleryListPanel assetClass="flag" />;
}
