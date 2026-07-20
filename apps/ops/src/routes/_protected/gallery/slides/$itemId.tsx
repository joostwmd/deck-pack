import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/features/gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/gallery/slides/$itemId")({
  component: SlidesDetailPage,
});

function SlidesDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="slide" itemId={itemId} />;
}
