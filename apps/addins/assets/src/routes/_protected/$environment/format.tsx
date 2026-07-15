import { createFileRoute } from "@tanstack/react-router";

import { FormatPanel } from "@/features/format/format-panel";

export const Route = createFileRoute("/_protected/$environment/format")({
  component: FormatPage,
});

function FormatPage() {
  return <FormatPanel />;
}
