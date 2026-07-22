import { createFileRoute } from "@tanstack/react-router";

import { FormatPage } from "@/pages/format/format-page";

export const Route = createFileRoute("/_protected/$environment/format")({
  component: FormatPage,
});
