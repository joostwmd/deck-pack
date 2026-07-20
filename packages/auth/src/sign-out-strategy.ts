import type { AuthClient } from "./client";
import type { MicrosoftSignInHost } from "./microsoft-sign-in-availability";
import type { MicrosoftTokenCache } from "./microsoft-token-cache";
import { markExplicitSignOut, type SessionContinuityStore } from "./session-continuity";

export interface BearerTokenStore {
  clear(): void;
}

export interface SignOutStrategy {
  signOut(): Promise<void>;
}

export class WebCookieSignOutStrategy implements SignOutStrategy {
  constructor(private readonly authClient: AuthClient) {}

  async signOut(): Promise<void> {
    await this.authClient.signOut();
  }
}

export class OfficeBearerSignOutStrategy implements SignOutStrategy {
  constructor(
    private readonly authClient: AuthClient,
    private readonly bearerStore: BearerTokenStore,
    private readonly continuityStore: SessionContinuityStore,
    private readonly microsoftTokenCache: MicrosoftTokenCache,
    private readonly clientId: string,
  ) {}

  async signOut(): Promise<void> {
    try {
      await this.authClient.signOut();
    } finally {
      this.bearerStore.clear();
      markExplicitSignOut(this.continuityStore);
      await this.microsoftTokenCache.clear(this.clientId).catch(() => {});
    }
  }
}

export function createSignOutStrategy(options: {
  host: MicrosoftSignInHost;
  authClient: AuthClient;
  bearerStore?: BearerTokenStore;
  continuityStore?: SessionContinuityStore;
  microsoftTokenCache?: MicrosoftTokenCache;
  clientId?: string;
}): SignOutStrategy {
  if (options.host === "office") {
    if (
      !options.bearerStore ||
      !options.continuityStore ||
      !options.microsoftTokenCache ||
      !options.clientId
    ) {
      throw new Error(
        "Office sign-out requires bearerStore, continuityStore, microsoftTokenCache, and clientId.",
      );
    }

    return new OfficeBearerSignOutStrategy(
      options.authClient,
      options.bearerStore,
      options.continuityStore,
      options.microsoftTokenCache,
      options.clientId,
    );
  }

  return new WebCookieSignOutStrategy(options.authClient);
}
