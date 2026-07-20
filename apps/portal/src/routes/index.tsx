import { OtpSignInView } from "@deck-pack/ui/components/composite/otp-sign-in-view";
import { useOtpSignIn } from "@deck-pack/ui/hooks/use-otp-sign-in";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { portalHomePath } from "@/config/portal-nav";
import { useServices } from "@/services/services-context";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      const orgId = session.data.session?.activeOrganizationId;
      redirect({
        to: portalHomePath(orgId),
        throw: true,
      });
    }
  },
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const { auth } = useServices();

  const otpProps = useOtpSignIn({
    auth: {
      sendVerificationOtp: auth.sendVerificationOtp,
      signInWithEmailOtp: auth.signInWithEmailOtp,
    },
    onSuccess: async () => {
      const session = await auth.getSession();
      const orgId = session.data?.session?.activeOrganizationId;
      void navigate({ to: portalHomePath(orgId) });
    },
    emailHelperText: "We'll email a one-time code to this address.",
    titleEmailStep: "Sign in to DeckPack",
    descriptionEmailStep: "We'll email you a one-time code. It expires in a few minutes.",
  });

  return <OtpSignInView {...otpProps} />;
}
