import { createFileRoute } from "@tanstack/react-router";

import { ThemesPanel } from "@/features/themes/themes-panel";

export const Route = createFileRoute("/_protected/$environment/themes")({
  component: ThemesPage,
});

function ThemesPage() {
  return <ThemesPanel />;
}
