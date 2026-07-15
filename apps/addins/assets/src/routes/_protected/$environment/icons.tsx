import { createFileRoute } from "@tanstack/react-router";

import { IconsPanel } from "@/features/icons/icons-panel";

export const Route = createFileRoute("/_protected/$environment/icons")({
  component: IconsPage,
});

function IconsPage() {
  return <IconsPanel />;
}
