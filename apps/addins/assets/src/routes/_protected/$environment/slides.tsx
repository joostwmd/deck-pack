import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/features/placeholder-page";

export const Route = createFileRoute("/_protected/$environment/slides")({
  component: SlidesPage,
});

function SlidesPage() {
  return (
    <PlaceholderPage
      title="Slides"
      description="Browse and insert slide templates into your presentation."
    />
  );
}
