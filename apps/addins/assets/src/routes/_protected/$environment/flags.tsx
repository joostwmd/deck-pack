import { createFileRoute } from "@tanstack/react-router";

import { FlagsPage } from "@/pages/flags/flags-page";

export const Route = createFileRoute("/_protected/$environment/flags")({
  component: FlagsPage,
});
