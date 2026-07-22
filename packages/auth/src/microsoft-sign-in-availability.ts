export type MicrosoftSignInHost = "web" | "office";

export function getMicrosoftSignInAvailability(options: {
  host: MicrosoftSignInHost;
  isNaaSupported: boolean;
  clientId: string | undefined;
}): { available: boolean; reason: string | null } {
  if (options.host !== "office") {
    return { available: true, reason: null };
  }

  if (!options.clientId) {
    return {
      available: false,
      reason:
        "Microsoft SSO is not configured. Set VITE_MICROSOFT_CLIENT_ID in the app environment.",
    };
  }

  if (!options.isNaaSupported) {
    return {
      available: false,
      reason:
        "Microsoft SSO isn't supported by this Office version (Nested App Authentication 1.1 required). Use email OTP instead.",
    };
  }

  return { available: true, reason: null };
}
