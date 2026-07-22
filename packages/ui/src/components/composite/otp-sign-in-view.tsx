import { OtpSignup, type OtpSignupProps } from "./otp-signup";

export type OtpSignInViewProps = OtpSignupProps;

export function OtpSignInView(props: OtpSignInViewProps) {
  return (
    <div className="flex h-svh w-full items-center justify-center px-4 py-8">
      <OtpSignup {...props} />
    </div>
  );
}
