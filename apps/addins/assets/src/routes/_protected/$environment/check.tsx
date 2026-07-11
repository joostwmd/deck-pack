import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/features/placeholder-page";

export const Route = createFileRoute("/_protected/$environment/check")({
  component: CheckPage,
});

function CheckPage() {
  return (
    <PlaceholderPage
      title="Check"
      description="Review presentation quality, consistency, and common issues."
    />
  );
}
