import { createFileRoute } from "@tanstack/react-router";

import { ShortcutsPage } from "@/features/settings/shortcuts-page";

export const Route = createFileRoute("/_protected/$environment/shortcuts")({
  component: ShortcutsPage,
});
