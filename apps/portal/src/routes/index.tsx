import { OtpSignInView } from "@deck-pack/ui/components/composite/otp-sign-in-view";
import { useOtpSignIn } from "@deck-pack/ui/hooks/use-otp-sign-in";
import {
  createMicrosoftSignInStrategy,
  getMicrosoftSignInAvailability,
} from "@deck-pack/auth/microsoft-sign-in";
import { env } from "@deck-pack/env/web";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { portalHomePath, workspaceFromSession } from "@/config/portal-nav";
import { useServices } from "@/services/services-context";
import { getAuthClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

const AUTH_CALLBACK_PATH = "/auth/callback";

async function resolvePortalHome() {
  const session = await getAuthClient().getSession();
  let workspace = workspaceFromSession(session.data?.session);
  if (session.data?.session?.activeOrganizationId) {
    const profile = await trpcClient.members.getOrganizationProfile.query();
    workspace = profile.workspace ?? workspace;
  }
  return portalHomePath(workspace);
}

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      redirect({
        to: await resolvePortalHome(),
        throw: true,
      });
    }
  },
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const { auth } = useServices();
  const [microsoftSigningIn, setMicrosoftSigningIn] = useState(false);

  const authClient = getAuthClient();
  const callbackURL = useMemo(
    () => `${window.location.origin}${AUTH_CALLBACK_PATH}`,
    [],
  );
  const microsoftAvailability = getMicrosoftSignInAvailability({
    host: "web",
    isNaaSupported: false,
    clientId: env.VITE_MICROSOFT_CLIENT_ID,
  });
  const microsoftStrategy = createMicrosoftSignInStrategy({
    authClient,
    host: "web",
    isNaaSupported: false,
    callbackURL,
    clientId: env.VITE_MICROSOFT_CLIENT_ID,
  });

  const handleMicrosoftSignIn = async () => {
    if (!microsoftStrategy) {
      toast.error(
        microsoftAvailability.reason ?? "Microsoft sign-in is not available in this host.",
      );
      return;
    }

    setMicrosoftSigningIn(true);
    try {
      const result = await microsoftStrategy.signIn();
      if (!result.ok) {
        toast.error(result.error);
      }
      // Web redirect: Better Auth navigates away once the OAuth flow starts.
    } catch {
      toast.error("Could not sign in with Microsoft. Try again or use email OTP.");
    } finally {
      setMicrosoftSigningIn(false);
    }
  };

  const otpProps = useOtpSignIn({
    auth: {
      sendVerificationOtp: auth.sendVerificationOtp,
      signInWithEmailOtp: auth.signInWithEmailOtp,
    },
    onSuccess: async () => {
      void navigate({ to: await resolvePortalHome() });
    },
    onMicrosoftSignIn: microsoftStrategy ? () => void handleMicrosoftSignIn() : undefined,
    microsoftDisabled: !microsoftAvailability.available,
    microsoftDisabledReason: microsoftAvailability.reason ?? undefined,
    microsoftSigningIn,
    emailHelperText: "We'll email a one-time code to this address.",
    titleEmailStep: "Sign in to DeckPack",
    descriptionEmailStep: "We'll email you a one-time code. It expires in a few minutes.",
  });

  return <OtpSignInView {...otpProps} />;
}
