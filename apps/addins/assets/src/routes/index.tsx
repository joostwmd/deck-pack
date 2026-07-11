import { Navigate, createFileRoute } from "@tanstack/react-router";

import { useOfficeDetection } from "@/hooks/use-office-detection";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { environment } = useOfficeDetection();

  return (
    <div style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>
      <div>React is rendering.</div>
      <div>environment: {environment}</div>
      <div>Redirecting to: {environment === "office" ? "/office" : "/web"}</div>
      <Navigate to={environment === "office" ? "/office" : "/web"} replace />
    </div>
  );
}
