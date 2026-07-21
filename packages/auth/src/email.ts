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

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) {
    throw new Error(
      "Resend error: " +
        (typeof error.message === "string" ? error.message : JSON.stringify(error)),
    );
  }
}

/**
 * Send a one-time code via Resend. `from` and API key always come from server env.
 */
export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  type: OtpEmailType;
}): Promise<void> {
  const { to, otp, type } = params;
  await sendResendEmail({
    to,
    subject: subjectByType[type],
    html: `<p>Your code is: <strong>${escapeHtml(otp)}</strong></p>
<p>It expires in a few minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

/**
 * Send an organization invitation link via Resend (same transport as OTP).
 */
export async function sendOrganizationInvitationEmail(params: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
}): Promise<void> {
  const org = escapeHtml(params.organizationName);
  const inviter = escapeHtml(params.inviterName);
  const link = escapeHtml(params.inviteLink);
  await sendResendEmail({
    to: params.to,
    subject: `Join ${params.organizationName} on DeckPack`,
    html: `<p>${inviter} invited you to join <strong>${org}</strong> on DeckPack.</p>
<p><a href="${link}">Accept invitation</a></p>
<p>If the button does not work, open this link:</p>
<p>${link}</p>
<p>If you did not expect this invitation, you can ignore this email.</p>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
