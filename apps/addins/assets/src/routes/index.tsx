import { createFileRoute, Navigate } from "@tanstack/react-router";

import Loader from "@/components/loader";
import { useOfficeDetection } from "@/hooks/useOfficeDetection";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { environment, isLoading } = useOfficeDetection();

  if (isLoading) {
    return <Loader />;
  }

  return <Navigate to={environment === "office" ? "/office" : "/web"} replace />;
}
