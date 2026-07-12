import { createFileRoute } from "@tanstack/react-router";

import { PhotosPanel } from "@/features/photos/photos-panel";

export const Route = createFileRoute("/_protected/$environment/photos")({
  component: PhotosPage,
});

function PhotosPage() {
  return <PhotosPanel />;
}
