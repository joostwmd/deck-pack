import { createFileRoute } from "@tanstack/react-router";

import { ShapesPage } from "@/pages/shapes/shapes-page";

export const Route = createFileRoute("/_protected/$environment/shapes")({
  component: ShapesPage,
});
