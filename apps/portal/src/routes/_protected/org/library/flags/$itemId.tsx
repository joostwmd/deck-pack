import { createFileRoute } from "@tanstack/react-router";

import { GalleryDetailPanel } from "@/features/library-gallery/gallery-detail-panel";

export const Route = createFileRoute("/_protected/org/library/flags/$itemId")({
  component: FlagsDetailPage,
});

function FlagsDetailPage() {
  const { itemId } = Route.useParams();
  return <GalleryDetailPanel assetClass="flag" itemId={itemId} />;
}
