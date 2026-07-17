import { createFileRoute, redirect } from "@tanstack/react-router";

import { OtpSignInView } from "@/features/auth/otp-sign-in-view";
import { useOtpSignInController } from "@/features/auth/use-otp-sign-in-controller";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      redirect({
        to: "/account",
        throw: true,
      });
    }
  },
  component: HomeComponent,
});

function HomeComponent() {
  const viewProps = useOtpSignInController({
    successPath: "/account",
    emailHelperText: "We’ll email a one-time code to this address.",
    titleEmailStep: "Sign in to DeckPack",
    descriptionEmailStep: "We’ll email you a one-time code. It expires in a few minutes.",
  });

  return <OtpSignInView {...viewProps} />;
}
