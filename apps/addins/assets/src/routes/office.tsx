import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/office")({
  component: OfficeComponent,
});

function OfficeComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Office.js Environment Detected</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        You are running inside PowerPoint. Logo insertion will target the active slide.
      </p>
    </div>
  );
}
