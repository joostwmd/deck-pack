import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Loader } from "@deck-pack/ui/components/system/loader";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import {
  DEFAULT_NAVIGATION_PAGE_ID,
  getPageRouteParams,
  getPageRouteTo,
} from "@/lib/navigation";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
  const navigate = useNavigate();
  const { environment } = useEnvironment();

  useEffect(() => {
    void navigate({
      to: getPageRouteTo(DEFAULT_NAVIGATION_PAGE_ID),
      params: getPageRouteParams(environment),
      replace: true,
    });
  }, [environment, navigate]);

  return (
    <div className="flex h-svh w-full items-center justify-center bg-background">
      <Loader />
    </div>
  );
}
