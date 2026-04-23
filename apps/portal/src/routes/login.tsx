import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import PublicHeader from "@/components/public-header";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      redirect({
        to: "/dashboard",
        throw: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PublicHeader />
      <div className="min-h-0 flex-1 overflow-auto px-2 py-4">
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </div>
  );
}
