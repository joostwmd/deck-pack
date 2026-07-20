import { APIError } from "better-auth";

const OTP_SIGN_IN_PATHS = new Set(["/email-otp/send-verification-otp", "/sign-in/email-otp"]);

export function isOpsAuthRequest(headers: Headers, opsOrigins: string[]): boolean {
  const origin = headers.get("origin");
  if (origin && opsOrigins.includes(origin)) {
    return true;
  }

  const referer = headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (opsOrigins.includes(refererOrigin)) {
        return true;
      }
    } catch {
      /* ignore malformed referer */
    }
  }

  return false;
}

export function emailMatchesAdminDomain(email: string, adminEmailDomain: string): boolean {
  const normalizedDomain = adminEmailDomain.toLowerCase();
  return email.trim().toLowerCase().endsWith(`@${normalizedDomain}`);
}

export function assertOpsOtpAllowed(args: {
  path: string;
  email: string | undefined;
  headers: Headers;
  opsOrigins: string[];
  adminEmailDomain: string;
}): void {
  if (!OTP_SIGN_IN_PATHS.has(args.path)) {
    return;
  }

  if (!isOpsAuthRequest(args.headers, args.opsOrigins)) {
    return;
  }

  if (!args.email || !emailMatchesAdminDomain(args.email, args.adminEmailDomain)) {
    throw new APIError("BAD_REQUEST", {
      message: `Email must use the @${args.adminEmailDomain} domain.`,
    });
  }
}
