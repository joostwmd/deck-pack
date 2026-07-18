import { createFileRoute } from "@tanstack/react-router";

import { PhotosPage } from "@/pages/photos/photos-page";

export const Route = createFileRoute("/_protected/$environment/photos")({
  component: PhotosPage,
});
