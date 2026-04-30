import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path; sign-in lives on `/`. */
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    redirect({
      to: "/",
      throw: true,
    });
  },
  component: () => null,
});
