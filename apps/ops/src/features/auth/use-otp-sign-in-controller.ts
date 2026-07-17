import type { OtpSignupStep } from "@deck-pack/ui/components/composite/otp-signup";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { displayNameFromEmail } from "@/features/auth/display-name";
import { useServices } from "@/services/services-context";

const OTP_LENGTH = 6;

export function useOtpSignInController(options: {
  successPath: "/dashboard";
  emailHelperText: string;
  titleEmailStep: string;
  descriptionEmailStep: string;
  header?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { auth } = useServices();

  const [step, setStep] = useState<OtpSignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Enter your email to continue");
      return;
    }
    setSending(true);
    try {
      const { error } = await auth.sendVerificationOtp({
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
  }, [auth, email]);

  const handleVerify = useCallback(async () => {
    if (otp.length < OTP_LENGTH) {
      toast.error(`Enter all ${String(OTP_LENGTH)} digits.`);
      return;
    }
    const trimmed = email.trim().toLowerCase();
    setVerifying(true);
    try {
      const { error } = await auth.signInWithEmailOtp({
        email: trimmed,
        otp,
        name: displayNameFromEmail(trimmed),
      });
      if (error) {
        toast.error(error.message ?? "That code did not work.");
        return;
      }
      toast.success("You’re signed in");
      void navigate({ to: options.successPath });
    } finally {
      setVerifying(false);
    }
  }, [auth, email, navigate, options.successPath, otp]);

  return {
    header: options.header,
    step,
    email,
    onEmailChange: setEmail,
    otp,
    onOtpChange: setOtp,
    onSubmitEmail: () => void handleSendCode(),
    onSubmitOtp: () => void handleVerify(),
    onBack: () => {
      setStep("email");
      setOtp("");
    },
    sending,
    verifying,
    otpLength: OTP_LENGTH,
    emailHelperText: options.emailHelperText,
    titleEmailStep: options.titleEmailStep,
    descriptionEmailStep: options.descriptionEmailStep,
  };
}
