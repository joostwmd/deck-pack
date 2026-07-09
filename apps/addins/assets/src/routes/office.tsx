import { createFileRoute } from "@tanstack/react-router";

import { OfficeLayout } from "@/features/layouts/office-layout";

export const Route = createFileRoute("/office")({
  component: OfficeComponent,
});

function OfficeComponent() {
  return <OfficeLayout />;
}
