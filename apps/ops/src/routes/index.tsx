import { OtpSignInView } from "@deck-pack/ui/components/composite/otp-sign-in-view";
import { useOtpSignIn } from "@deck-pack/ui/hooks/use-otp-sign-in";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { useServices } from "@/services/services-context";

const OPS_EMAIL_DOMAIN = "code.berlin";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data && session.data.user.role === "admin") {
      redirect({
        to: "/dashboard",
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
    onSuccess: () => {
      void navigate({ to: "/dashboard" });
    },
    logo: (
      <div className="space-y-0.5">
        <p className="text-sm font-semibold tracking-tight">Deck Pack Ops</p>
        <p className="text-xs text-muted-foreground">Internal dashboard</p>
      </div>
    ),
    emailHelperText: `Sign in with your @${OPS_EMAIL_DOMAIN} address.`,
    titleEmailStep: "Internal dashboard",
    descriptionEmailStep: "We'll email you a one-time code. It expires in a few minutes.",
  });

  return <OtpSignInView {...otpProps} />;
}
