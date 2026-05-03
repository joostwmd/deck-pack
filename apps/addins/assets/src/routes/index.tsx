import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Under construction</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        DeckPack add-in is currently under development.
      </p>
    </div>
  );
}
