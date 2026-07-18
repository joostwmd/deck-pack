import { createFileRoute, redirect } from "@tanstack/react-router";

import { OtpSignInView } from "@/features/auth/otp-sign-in-view";
import { useOtpSignInController } from "@/features/auth/use-otp-sign-in-controller";

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
  const viewProps = useOtpSignInController({
    successPath: "/dashboard",
    emailHelperText: `Sign in with your @${OPS_EMAIL_DOMAIN} address.`,
    titleEmailStep: "Internal dashboard",
    descriptionEmailStep: "We’ll email you a one-time code. It expires in a few minutes.",
    header: (
      <>
        <h1 className="text-2xl font-bold">Deck Pack Ops</h1>
        <p className="text-sm text-muted-foreground">Internal dashboard</p>
        <p className="text-sm text-muted-foreground">
          We’ll email you a one-time code. It expires in a few minutes.
        </p>
      </>
    ),
  });

  return <OtpSignInView {...viewProps} />;
}
