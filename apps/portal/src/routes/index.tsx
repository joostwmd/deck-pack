import { OtpSignup, type OtpSignupStep } from "@deck-pack/ui/components/composite/otp-signup";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/utils/auth";

const OTP_LENGTH = 6;

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

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "User";
  return localPart
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function HomeComponent() {
  const navigate = useNavigate();

  const [step, setStep] = useState<OtpSignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
      toast.success("You’re signed in");
      void navigate({ to: "/account" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container flex min-h-[min(100dvh,48rem)] flex-col items-center justify-center px-2 py-8">
      <OtpSignup
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
        sending={sending}
        verifying={verifying}
        otpLength={OTP_LENGTH}
        emailHelperText="We’ll email a one-time code to this address."
        titleEmailStep="Sign in to DeckPack"
        descriptionEmailStep="We’ll email you a one-time code. It expires in a few minutes."
      />
    </div>
  );
}
