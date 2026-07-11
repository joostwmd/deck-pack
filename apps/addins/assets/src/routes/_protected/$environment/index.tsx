import { createFileRoute, redirect } from "@tanstack/react-router";

import { DEFAULT_NAVIGATION_PAGE_ID, getPageRouteTo } from "@/lib/navigation";

export const Route = createFileRoute("/_protected/$environment/")({
  beforeLoad: ({ params }) => {
    redirect({
      to: getPageRouteTo(DEFAULT_NAVIGATION_PAGE_ID),
      params: { environment: params.environment },
      throw: true,
    });
  },
});
