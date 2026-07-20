import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/features/library-gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/org/library/slides/$itemId")({
  component: SlidesDetailPage,
});

function SlidesDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="slide" itemId={itemId} />;
}
