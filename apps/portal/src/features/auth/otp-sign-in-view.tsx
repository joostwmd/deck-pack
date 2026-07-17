import { OtpSignup } from "@deck-pack/ui/components/composite/otp-signup";

export interface OtpSignInViewProps {
  header?: React.ReactNode;
  step: "email" | "otp";
  email: string;
  onEmailChange: (value: string) => void;
  otp: string;
  onOtpChange: (value: string) => void;
  onSubmitEmail: () => void;
  onSubmitOtp: () => void;
  onBack: () => void;
  sending: boolean;
  verifying: boolean;
  otpLength: number;
  emailHelperText: string;
  titleEmailStep: string;
  descriptionEmailStep: string;
}

export function OtpSignInView(props: OtpSignInViewProps) {
  return (
    <div className="container flex min-h-[min(100dvh,48rem)] flex-col items-center justify-center px-2 py-8">
      {props.header}
      <OtpSignup
        step={props.step}
        email={props.email}
        onEmailChange={props.onEmailChange}
        otp={props.otp}
        onOtpChange={props.onOtpChange}
        onSubmitEmail={props.onSubmitEmail}
        onSubmitOtp={props.onSubmitOtp}
        onBack={props.onBack}
        sending={props.sending}
        verifying={props.verifying}
        otpLength={props.otpLength}
        emailHelperText={props.emailHelperText}
        titleEmailStep={props.titleEmailStep}
        descriptionEmailStep={props.descriptionEmailStep}
      />
    </div>
  );
}
