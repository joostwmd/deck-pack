import { createFileRoute } from "@tanstack/react-router";

import { SlidesPage } from "@/pages/slides/slides-page";

export const Route = createFileRoute("/_protected/$environment/slides")({
  component: SlidesPage,
});
