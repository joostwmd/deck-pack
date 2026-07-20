import { OtpSignup, type OtpSignupProps } from "./otp-signup";

export type OtpSignInViewProps = OtpSignupProps;

export function OtpSignInView(props: OtpSignInViewProps) {
  return (
    <div className="container flex min-h-[min(100dvh,48rem)] flex-col items-center justify-center px-2 py-8">
      <OtpSignup {...props} />
    </div>
  );
}
