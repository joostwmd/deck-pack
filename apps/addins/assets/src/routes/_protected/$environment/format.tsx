import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/features/placeholder-page";

export const Route = createFileRoute("/_protected/$environment/format")({
  component: FormatPage,
});

function FormatPage() {
  return (
    <PlaceholderPage
      title="Format"
      description="Apply formatting rules and clean up slide layouts."
    />
  );
}
