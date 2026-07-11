import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { OfficeLayout } from "@/features/layouts/office-layout";
import { WebLayout } from "@/features/layouts/web-layout";
import { isAppEnvironment } from "@/lib/navigation";

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
