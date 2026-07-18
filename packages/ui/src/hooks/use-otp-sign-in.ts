import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { OtpSignupProps, OtpSignupStep } from "../components/composite/otp-signup";
import { displayNameFromEmail } from "../lib/display-name-from-email";

const DEFAULT_OTP_LENGTH = 6;

export type OtpSignInAuth = {
  sendVerificationOtp: (input: {
    email: string;
    type: "sign-in";
  }) => Promise<{ error?: { message?: string } | null }>;
  signInWithEmailOtp: (input: {
    email: string;
    otp: string;
    name: string;
  }) => Promise<{ error?: { message?: string } | null }>;
};

export type UseOtpSignInOptions = Pick<
  OtpSignupProps,
  | "logo"
  | "emailHelperText"
  | "titleEmailStep"
  | "descriptionEmailStep"
  | "titleOtpStep"
  | "descriptionOtpStep"
  | "onMicrosoftSignIn"
  | "microsoftDisabled"
  | "microsoftDisabledReason"
  | "microsoftSigningIn"
  | "errorMessage"
> & {
  auth: OtpSignInAuth;
  onSuccess: () => void;
  otpLength?: number;
};

export function useOtpSignIn(options: UseOtpSignInOptions): OtpSignupProps {
  const otpLength = options.otpLength ?? DEFAULT_OTP_LENGTH;

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
      const { error } = await options.auth.sendVerificationOtp({
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
  }, [email, options.auth]);

  const handleVerify = useCallback(async () => {
    if (otp.length < otpLength) {
      toast.error(`Enter all ${String(otpLength)} digits.`);
      return;
    }
    const trimmed = email.trim().toLowerCase();
    setVerifying(true);
    try {
      const { error } = await options.auth.signInWithEmailOtp({
        email: trimmed,
        otp,
        name: displayNameFromEmail(trimmed),
      });
      if (error) {
        toast.error(error.message ?? "That code did not work.");
        return;
      }
      toast.success("You're signed in");
      options.onSuccess();
    } finally {
      setVerifying(false);
    }
  }, [email, options, otp, otpLength]);

  return {
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
    onResendCode: () => void handleSendCode(),
    sending,
    verifying,
    resending: sending,
    otpLength,
    logo: options.logo,
    emailHelperText: options.emailHelperText,
    titleEmailStep: options.titleEmailStep,
    descriptionEmailStep: options.descriptionEmailStep,
    titleOtpStep: options.titleOtpStep,
    descriptionOtpStep: options.descriptionOtpStep,
    onMicrosoftSignIn: options.onMicrosoftSignIn,
    microsoftDisabled: options.microsoftDisabled,
    microsoftDisabledReason: options.microsoftDisabledReason,
    microsoftSigningIn: options.microsoftSigningIn,
    errorMessage: options.errorMessage,
  };
}
