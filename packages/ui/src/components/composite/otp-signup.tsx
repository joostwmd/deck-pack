import * as React from "react";

import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@deck-pack/ui/components/system/input-otp";
import { Label } from "@deck-pack/ui/components/system/label";
import { cn } from "@deck-pack/ui/lib/utils";
import { SpinnerIcon } from "@phosphor-icons/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export type OtpSignupStep = "email" | "otp";

export type OtpSignupProps = {
  /** Which screen to render: the email step or the OTP step. Fully controlled. */
  step: OtpSignupStep;

  /** Controlled email value + change handler. */
  email: string;
  onEmailChange: (value: string) => void;

  /** Controlled OTP value + change handler. */
  otp: string;
  onOtpChange: (value: string) => void;

  /** Called when the email form is submitted. Do API calls, toasts, validation, and step changes outside. */
  onSubmitEmail: () => void;
  /** Called when the OTP form is submitted. Same contract as onSubmitEmail. */
  onSubmitOtp: () => void;
  /** Called when the user presses "Use a different email" on the OTP step. */
  onBack: () => void;

  /** When provided, renders a Microsoft sign-in button on the email step. */
  onMicrosoftSignIn?: () => void;
  /** Disable the Microsoft button (e.g. while a social sign-in redirect is in flight). */
  microsoftSigningIn?: boolean;

  /** Disable the email form (e.g. while a request is in flight). */
  sending?: boolean;
  /** Disable the OTP form (e.g. while verifying). */
  verifying?: boolean;

  /** Length of the code from your auth provider (Better Auth default is 6). */
  otpLength?: number;
  className?: string;

  /** Optional brand slot rendered above the title on both steps. */
  logo?: React.ReactNode;

  /** Shown under the email field, e.g. "Use your @code.berlin address". */
  emailHelperText?: string;
  titleEmailStep?: string;
  descriptionEmailStep?: string;
  titleOtpStep?: string;
  /** "{n}" and "{email}" are replaced. */
  descriptionOtpStep?: string;
  /** Override the Microsoft button label. */
  microsoftLabel?: string;
  microsoftSigningInLabel?: string;
  /** Override the divider between Microsoft and email sign-in. */
  dividerLabel?: string;
  /** Override the primary button on the email step ("Send code"). */
  sendCodeLabel?: string;
  sendingLabel?: string;
  /** Override the primary button on the OTP step ("Sign in"). */
  verifyLabel?: string;
  verifyingLabel?: string;
  /** Override the back button on the OTP step. */
  backLabel?: string;
};

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 21 21"
      className={cn("size-4 shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function OtpSignupHeader({
  logo,
  title,
  description,
}: {
  logo?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      {logo ? <div className="flex justify-start">{logo}</div> : null}
      <div className="space-y-1.5 text-left">
        <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-balance text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function OtpSignupDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div aria-hidden="true" className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Two-step email OTP: (1) email → (2) enter digits from the email.
 * **Fully controlled + presentational.** All validation, toasts, API calls and step transitions
 * happen in the parent.
 */
export function OtpSignup({
  step,
  email,
  onEmailChange,
  otp,
  onOtpChange,
  onSubmitEmail,
  onSubmitOtp,
  onBack,
  onMicrosoftSignIn,
  microsoftSigningIn = false,
  sending = false,
  verifying = false,
  otpLength = 6,
  className,
  logo,
  emailHelperText,
  titleEmailStep = "Sign in with your email",
  descriptionEmailStep = "We’ll email you a one-time code. It expires in a few minutes.",
  titleOtpStep = "Enter the code from your email",
  descriptionOtpStep = "We sent a {n}-digit code to {email}.",
  microsoftLabel = "Continue with Microsoft",
  microsoftSigningInLabel = "Signing in…",
  dividerLabel = "or continue with email",
  sendCodeLabel = "Send code",
  sendingLabel = "Sending…",
  verifyLabel = "Sign in",
  verifyingLabel = "Signing in…",
  backLabel = "Use a different email",
}: OtpSignupProps) {
  const slots = React.useMemo(() => Array.from({ length: otpLength }, (_, i) => i), [otpLength]);

  const firstGroup = Math.ceil(otpLength / 2);
  const secondGroup = otpLength - firstGroup;

  const otpDescription = descriptionOtpStep
    .replace("{n}", String(otpLength))
    .replace("{email}", email.trim() || "your address");

  const emailStepBusy = sending || microsoftSigningIn;
  const showMicrosoftSignIn = Boolean(onMicrosoftSignIn);

  if (step === "email") {
    return (
      <div className={cn("mx-auto w-full max-w-sm space-y-6", className)}>
        <OtpSignupHeader
          logo={logo}
          title={titleEmailStep}
          description={descriptionEmailStep}
        />

        <div className="space-y-4">
          {showMicrosoftSignIn ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onMicrosoftSignIn}
              disabled={emailStepBusy}
            >
              {microsoftSigningIn ? (
                <SpinnerIcon className="animate-spin motion-reduce:animate-none" />
              ) : (
                <MicrosoftLogo />
              )}
              {microsoftSigningIn ? microsoftSigningInLabel : microsoftLabel}
            </Button>
          ) : null}

          {showMicrosoftSignIn ? <OtpSignupDivider label={dividerLabel} /> : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitEmail();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="otp-signup-email" className="text-foreground">
                Email
              </Label>
              <Input
                id="otp-signup-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={emailStepBusy}
                className="border-border bg-background"
                aria-describedby={emailHelperText ? "otp-signup-email-hint" : undefined}
              />
              {emailHelperText ? (
                <p className="text-xs text-muted-foreground" id="otp-signup-email-hint">
                  {emailHelperText}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={emailStepBusy}>
              {sending ? sendingLabel : sendCodeLabel}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm space-y-6", className)}>
      <OtpSignupHeader logo={logo} title={titleOtpStep} description={otpDescription} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitOtp();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label
            id="otp-signup-otp-label"
            htmlFor="otp-signup-otp-input"
            className="text-foreground"
          >
            One-time code
          </Label>
          <p className="sr-only" id="otp-signup-otp-hint">
            Type or paste the {String(otpLength)} digits from the email, then use {verifyLabel}.
          </p>
          <div className="flex justify-start">
            <InputOTP
              id="otp-signup-otp-input"
              maxLength={otpLength}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={onOtpChange}
              disabled={verifying}
              aria-label="One-time code from email"
              aria-describedby="otp-signup-otp-hint"
              className="disabled:cursor-not-allowed"
              containerClassName="justify-start"
            >
              {firstGroup > 0 && (
                <InputOTPGroup>
                  {slots.slice(0, firstGroup).map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              )}
              {firstGroup > 0 && secondGroup > 0 && <InputOTPSeparator />}
              {secondGroup > 0 && (
                <InputOTPGroup>
                  {slots.slice(firstGroup, otpLength).map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              )}
            </InputOTP>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={verifying || otp.length < otpLength}>
            {verifying ? verifyingLabel : verifyLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
            disabled={verifying}
          >
            {backLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
