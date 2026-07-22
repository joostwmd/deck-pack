import { createFileRoute } from "@tanstack/react-router";

import { IconsPage } from "@/pages/icons/icons-page";

export const Route = createFileRoute("/_protected/$environment/icons")({
  component: IconsPage,
});
