import { createFileRoute } from "@tanstack/react-router";

import { LogosPage } from "@/pages/logos/logos-page";

export const Route = createFileRoute("/_protected/$environment/logos")({
  component: LogosPage,
});
