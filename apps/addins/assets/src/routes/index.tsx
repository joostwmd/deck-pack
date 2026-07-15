import { Navigate, createFileRoute } from "@tanstack/react-router";

import { useOfficeDetection } from "@/hooks/use-office-detection";
import {
  DEFAULT_NAVIGATION_PAGE_ID,
  getPageRouteParams,
  getPageRouteTo,
} from "@/lib/navigation";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { environment } = useOfficeDetection();

  return (
    <Navigate
      to={getPageRouteTo(DEFAULT_NAVIGATION_PAGE_ID)}
      params={getPageRouteParams(environment)}
      replace
    />
  );
}
