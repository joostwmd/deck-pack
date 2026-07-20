import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/features/gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/gallery/shapes/$itemId")({
  component: ShapesDetailPage,
});

function ShapesDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="shape" itemId={itemId} />;
}
