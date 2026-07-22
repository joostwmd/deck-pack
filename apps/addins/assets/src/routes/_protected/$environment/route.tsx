import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { OfficeLayout } from "@/components/shell/office-layout";
import { WebLayout } from "@/components/shell/web-layout";
import { isAppEnvironment } from "@/constants/navigation";

export const Route = createFileRoute("/_protected/$environment")({
  beforeLoad: ({ params }) => {
    if (!isAppEnvironment(params.environment)) {
      throw notFound();
    }
  },
  component: EnvironmentLayout,
});

function EnvironmentLayout() {
  const { environment } = Route.useParams();

  if (environment === "office") {
    return (
      <OfficeLayout>
        <Outlet />
      </OfficeLayout>
    );
  }

  return (
    <WebLayout>
      <Outlet />
    </WebLayout>
  );
}
