import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ThemeProvider } from "../system/theme-provider";
import { OtpSignup } from "./otp-signup";

const meta = {
  title: "Composite/OtpSignup",
  component: OtpSignup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="w-[400px] bg-background p-4 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof OtpSignup>;

export default meta;
type Story = StoryObj<typeof meta>;

function OtpSignupDemo() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <OtpSignup
      step={step}
      email={email}
      onEmailChange={setEmail}
      otp={otp}
      onOtpChange={setOtp}
      onSubmitEmail={() => setStep("otp")}
      onSubmitOtp={() => undefined}
      onBack={() => setStep("email")}
      onResendCode={() => undefined}
      onMicrosoftSignIn={() => undefined}
    />
  );
}

export const EmailStep: Story = {
  render: () => <OtpSignupDemo />,
};

export const OtpStep: Story = {
  render: () => (
    <OtpSignup
      step="otp"
      email="user@example.com"
      onEmailChange={() => undefined}
      otp=""
      onOtpChange={() => undefined}
      onSubmitEmail={() => undefined}
      onSubmitOtp={() => undefined}
      onBack={() => undefined}
      onResendCode={() => undefined}
    />
  ),
};
