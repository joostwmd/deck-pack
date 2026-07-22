import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/solo/subscription")({
  beforeLoad: () => {
    throw redirect({ to: "/solo/home" });
  },
});
