import { createFileRoute } from "@tanstack/react-router";

import { CheckPage } from "@/pages/check/check-page";

export const Route = createFileRoute("/_protected/$environment/check")({
  component: CheckPage,
});
