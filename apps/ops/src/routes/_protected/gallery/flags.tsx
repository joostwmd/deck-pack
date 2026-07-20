import { createFileRoute } from "@tanstack/react-router";

import { GalleryPlaceholderPage } from "@/features/gallery/gallery-placeholder-page";

export const Route = createFileRoute("/_protected/gallery/flags")({
  component: FlagsPage,
});

function FlagsPage() {
  return (
    <GalleryPlaceholderPage
      title="Flags"
      description="Manage country and region flags available in the add-in gallery"
    />
  );
}
