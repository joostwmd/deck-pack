import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path; sign-in lives on `/` with the same email OTP flow as ops. */
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    redirect({
      to: "/",
      throw: true,
    });
  },
  component: () => null,
});
