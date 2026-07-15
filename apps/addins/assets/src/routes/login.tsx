import { OtpSignup, type OtpSignupStep } from "@deck-pack/ui/components/composite/otp-signup";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { getMicrosoftSignInAvailability } from "@/auth/microsoft-sign-in-availability";
import { getBearerToken, setBearerToken } from "@/auth/bearer-session-store";
import { createMicrosoftSignInStrategy } from "@/auth/microsoft-sign-in-strategy";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useOffice } from "@/contexts/OfficeContext";
import {
  DEFAULT_NAVIGATION_PAGE_ID,
  getPageRouteParams,
  getPageRouteTo,
} from "@/lib/navigation";
import { getAuthClient } from "@/utils/auth";
import { env } from "@deck-pack/env/web";

const OTP_LENGTH = 6;
const AUTH_CALLBACK_PATH = "/auth/callback";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      redirect({
        to: "/",
        throw: true,
      });
    }
  },
  component: LoginComponent,
});

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "User";
  return localPart
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function LoginComponent() {
  const navigate = useNavigate();
  const authClient = getAuthClient();
  const { environment } = useEnvironment();
  const { isNaaSupported } = useOffice();

  const [step, setStep] = useState<OtpSignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [microsoftSigningIn, setMicrosoftSigningIn] = useState(false);

  const postAuthPath = getPageRouteTo(DEFAULT_NAVIGATION_PAGE_ID);
  const postAuthParams = getPageRouteParams(environment);
  const microsoftAvailability = getMicrosoftSignInAvailability({
    environment,
    isNaaSupported,
    clientId: env.VITE_MICROSOFT_CLIENT_ID,
  });
  const microsoftStrategy = createMicrosoftSignInStrategy({
    authClient,
    environment,
    isNaaSupported,
    callbackURL: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
    clientId: env.VITE_MICROSOFT_CLIENT_ID,
    getCapturedBearerToken: getBearerToken,
  });

  const sendCodeToEmail = async (isResend = false) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Enter your email to continue");
      return;
    }
    
    const setLoading = isResend ? setResending : setSending;
    setLoading(true);
    
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmed,
        type: "sign-in",
      });
      if (error) {
        toast.error(error.message ?? "Could not send the code. Try again in a moment.");
        return;
      }
      setOtp("");
      if (!isResend) {
        setStep("otp");
      } else {
        toast.success("Code sent to your email");
      }
    } catch {
      toast.error("Could not send the code. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = () => sendCodeToEmail(false);
  const handleResendCode = () => sendCodeToEmail(true);

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      toast.error(`Enter all ${String(OTP_LENGTH)} digits.`);
      return;
    }
    const trimmed = email.trim().toLowerCase();
    setVerifying(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: trimmed,
        otp,
        name: displayNameFromEmail(trimmed),
      });
      if (error) {
        toast.error(error.message ?? "That code did not work.");
        return;
      }

      if (environment === "office") {
        const bearerToken = getBearerToken();
        if (!bearerToken) {
          toast.error("Could not sign in. Try again.");
          return;
        }
        setBearerToken(bearerToken);
      }

      toast.success("You're signed in");
      void navigate({ to: postAuthPath, params: postAuthParams });
    } catch {
      toast.error("That code did not work.");
    } finally {
      setVerifying(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    if (!microsoftStrategy) {
      toast.error(microsoftAvailability.reason ?? "Microsoft sign-in is not available in this host.");
      return;
    }

    setMicrosoftSigningIn(true);
    try {
      const result = await microsoftStrategy.signIn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (!result.bearerToken) {
        toast.error("Could not sign in with Microsoft. Try again or use email OTP.");
        return;
      }

      setBearerToken(result.bearerToken);
      toast.success("You're signed in");
      void navigate({ to: postAuthPath, params: postAuthParams });
    } catch {
      toast.error("Could not sign in with Microsoft. Try again or use email OTP.");
    } finally {
      setMicrosoftSigningIn(false);
    }
  };

  return (
    <div className="flex h-svh w-full items-center justify-center bg-background px-4 py-6">
      <OtpSignup
        className="w-full max-w-[400px]"
        step={step}
        email={email}
        onEmailChange={setEmail}
        otp={otp}
        onOtpChange={setOtp}
        onSubmitEmail={() => void handleSendCode()}
        onSubmitOtp={() => void handleVerify()}
        onBack={() => {
          setStep("email");
          setOtp("");
        }}
        onResendCode={() => void handleResendCode()}
        onMicrosoftSignIn={
          microsoftStrategy ? () => void handleMicrosoftSignIn() : undefined
        }
        microsoftDisabled={!microsoftAvailability.available}
        microsoftDisabledReason={microsoftAvailability.reason ?? undefined}
        microsoftSigningIn={microsoftSigningIn}
        sending={sending}
        verifying={verifying}
        resending={resending}
        otpLength={OTP_LENGTH}
        logo={
          <span className="text-sm font-semibold tracking-tight text-foreground">DeckPack</span>
        }
        emailHelperText="We'll email a one-time code to this address."
        titleEmailStep="Sign in to DeckPack"
        descriptionEmailStep="We'll email you a one-time code. It expires in a few minutes."
      />
    </div>
  );
}
