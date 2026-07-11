import { createFileRoute } from "@tanstack/react-router";

import { PhotosPanel } from "@/features/photos/photos-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/photos")({
  component: PhotosPage,
});

function PhotosPage() {
  const { environment } = Route.useParams();

  return <PhotosPanel mode={toAssetPanelMode(environment)} />;
}
