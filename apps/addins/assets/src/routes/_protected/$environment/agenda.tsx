import { createFileRoute } from "@tanstack/react-router";

import { AgendaPage } from "@/pages/agenda/agenda-page";

export const Route = createFileRoute("/_protected/$environment/agenda")({
  component: AgendaPage,
});
