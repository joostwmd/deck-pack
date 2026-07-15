import { createFileRoute } from "@tanstack/react-router";

import { SlidesPanel } from "@/features/slides/slides-panel";

export const Route = createFileRoute("/_protected/$environment/slides")({
  component: SlidesPage,
});

function SlidesPage() {
  return <SlidesPanel />;
}
