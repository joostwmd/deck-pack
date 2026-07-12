import type { EnvironmentType } from "@/contexts/EnvironmentContext";

export function getMicrosoftSignInAvailability(options: {
  environment: EnvironmentType;
  isNaaSupported: boolean;
  clientId: string | undefined;
}): { available: boolean; reason: string | null } {
  if (options.environment !== "office") {
    return { available: true, reason: null };
  }

  if (!options.clientId) {
    return {
      available: false,
      reason:
        "Microsoft SSO is not configured. Set VITE_MICROSOFT_CLIENT_ID in apps/addins/assets/.env.",
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
