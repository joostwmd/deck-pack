import { Resend } from "resend";

import { env } from "@deck-pack/env/server";

export type OtpEmailType = "sign-in" | "email-verification" | "forget-password" | "change-email";

const subjectByType: Record<OtpEmailType, string> = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm your new email",
};

const resend = new Resend(env.EMAIL_API_KEY);

/**
 * Send a one-time code via Resend. `from` and API key always come from server env.
 */
export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  type: OtpEmailType;
}): Promise<void> {
  const { to, otp, type } = params;
  const subject = subjectByType[type];
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html: `<p>Your code is: <strong>${escapeHtml(otp)}</strong></p>
<p>It expires in a few minutes. If you did not request this, you can ignore this email.</p>`,
  });
  if (error) {
    throw new Error(
      "Resend error: " +
        (typeof error.message === "string" ? error.message : JSON.stringify(error)),
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
