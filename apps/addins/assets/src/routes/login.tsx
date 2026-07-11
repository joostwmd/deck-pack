import { OtpSignup, type OtpSignupStep } from "@deck-pack/ui/components/composite/otp-signup";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import {
  DEFAULT_NAVIGATION_PAGE_ID,
  getPageRouteParams,
  getPageRouteTo,
} from "@/lib/navigation";
import { authClient } from "@/utils/auth";

const OTP_LENGTH = 6;

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
  const { environment } = useEnvironment();

  const [step, setStep] = useState<OtpSignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [microsoftSigningIn, setMicrosoftSigningIn] = useState(false);

  const postAuthPath = getPageRouteTo(DEFAULT_NAVIGATION_PAGE_ID);
  const postAuthParams = getPageRouteParams(environment);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Enter your email to continue");
      return;
    }
    setSending(true);
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
      setStep("otp");
    } finally {
      setSending(false);
    }
  };

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
      toast.success("You're signed in");
      void navigate({ to: postAuthPath, params: postAuthParams });
    } finally {
      setVerifying(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setMicrosoftSigningIn(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: `${window.location.origin}${postAuthPath.replace("$environment", environment)}`,
      });
      if (error) {
        toast.error(error.message ?? "Could not start Microsoft sign-in.");
      }
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
        onMicrosoftSignIn={() => void handleMicrosoftSignIn()}
        microsoftSigningIn={microsoftSigningIn}
        sending={sending}
        verifying={verifying}
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
