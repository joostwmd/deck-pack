import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/web")({
  component: WebComponent,
});

function WebComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Web Environment - Office.js Not Available
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        You are using the standalone web experience. Build slides here and download them for
        PowerPoint.
      </p>
    </div>
  );
}
