import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/domains/gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/org/gallery/slides/$itemId")({
  component: SlidesDetailPage,
});

function SlidesDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="slide" itemId={itemId} />;
}
