import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/domains/gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/gallery/flags/$itemId")({
  component: FlagsDetailPage,
});

function FlagsDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="flag" itemId={itemId} />;
}
