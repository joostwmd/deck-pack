import { createFileRoute } from "@tanstack/react-router";

import { ThemesPage } from "@/pages/themes/themes-page";

export const Route = createFileRoute("/_protected/$environment/themes")({
  component: ThemesPage,
});
