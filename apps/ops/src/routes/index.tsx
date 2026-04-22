import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="container px-2 py-2">
      <h1>Internal Dashbaord</h1>
    </div>
  );
}
