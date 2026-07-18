import type { AuthClient } from "@deck-pack/auth/client";

import type { EnvironmentType } from "@/contexts/EnvironmentContext";

import { acquireMicrosoftTokens } from "./microsoft-naa";

export type MicrosoftSignInResult =
  | { ok: true; bearerToken?: string }
  | { ok: false; error: string };

export interface MicrosoftSignInStrategy {
  signIn(): Promise<MicrosoftSignInResult>;
}

type AppAuthClient = AuthClient;

function authErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
}

export class WebMicrosoftSignInStrategy implements MicrosoftSignInStrategy {
  constructor(
    private readonly authClient: AppAuthClient,
    private readonly callbackURL: string,
  ) {}

  async signIn(): Promise<MicrosoftSignInResult> {
    try {
      const { error } = await this.authClient.signIn.social({
        provider: "microsoft",
        callbackURL: this.callbackURL,
      });

      if (error) {
        return {
          ok: false,
          error: authErrorMessage(error, "Could not start Microsoft sign-in."),
        };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: authErrorMessage(error, "Could not start Microsoft sign-in."),
      };
    }
  }
}

export class OfficeNaaMicrosoftSignInStrategy implements MicrosoftSignInStrategy {
  constructor(
    private readonly authClient: AppAuthClient,
    private readonly clientId: string,
    private readonly getCapturedBearerToken: () => string | null,
  ) {}

  async signIn(): Promise<MicrosoftSignInResult> {
    let authenticationResult;

    try {
      authenticationResult = await acquireMicrosoftTokens(this.clientId);
    } catch {
      return {
        ok: false,
        error: "Could not sign in with Microsoft. Try again or use email OTP.",
      };
    }

    if (!authenticationResult.idToken) {
      return {
        ok: false,
        error: "Could not sign in with Microsoft. Try again or use email OTP.",
      };
    }

    let error: { message?: string } | null = null;

    try {
      const response = await this.authClient.signIn.social({
        provider: "microsoft",
        idToken: {
          token: authenticationResult.idToken,
          accessToken: authenticationResult.accessToken,
        },
      });
      error = response.error;
    } catch (signInError) {
      return {
        ok: false,
        error: authErrorMessage(signInError, "Could not sign in with Microsoft. Try again or use email OTP."),
      };
    }

    if (error) {
      return {
        ok: false,
        error: authErrorMessage(error, "Could not sign in with Microsoft. Try again or use email OTP."),
      };
    }

    const bearerToken = this.getCapturedBearerToken();
    if (!bearerToken) {
      return {
        ok: false,
        error: "Could not sign in with Microsoft. Try again or use email OTP.",
      };
    }

    return { ok: true, bearerToken };
  }
}

export function createMicrosoftSignInStrategy(options: {
  authClient: AppAuthClient;
  environment: EnvironmentType;
  isNaaSupported: boolean;
  callbackURL: string;
  clientId: string | undefined;
  getCapturedBearerToken?: () => string | null;
}): MicrosoftSignInStrategy | null {
  if (options.environment === "web") {
    return new WebMicrosoftSignInStrategy(options.authClient, options.callbackURL);
  }

  if (!options.isNaaSupported || !options.clientId) {
    return null;
  }

  return new OfficeNaaMicrosoftSignInStrategy(
    options.authClient,
    options.clientId,
    options.getCapturedBearerToken ?? (() => null),
  );
}
