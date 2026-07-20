import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_SILENT_RESTORE,
  REQUIRE_EXPLICIT_SIGN_IN,
} from "@deck-pack/auth/microsoft-sign-in";
import {
  OfficeBearerSignOutStrategy,
  WebCookieSignOutStrategy,
  createSignOutStrategy,
} from "@deck-pack/auth/microsoft-sign-in";

function createMockAuthClient() {
  return {
    signOut: vi.fn().mockResolvedValue(undefined),
  } as unknown as import("@deck-pack/auth/client").AuthClient;
}

function createInMemoryContinuity() {
  let value = ALLOW_SILENT_RESTORE;
  return {
    get: () => value,
    set: (next: typeof value) => {
      value = next;
    },
  };
}

describe("createSignOutStrategy", () => {
  it("returns web cookie strategy in browser preview", () => {
    const authClient = createMockAuthClient();
    const strategy = createSignOutStrategy({
      host: "web",
      authClient,
    });

    expect(strategy).toBeInstanceOf(WebCookieSignOutStrategy);
  });

  it("returns office bearer strategy for office hosts", () => {
    const authClient = createMockAuthClient();
    const strategy = createSignOutStrategy({
      host: "office",
      authClient,
      bearerStore: { clear: vi.fn() },
      continuityStore: createInMemoryContinuity(),
      microsoftTokenCache: { clear: vi.fn().mockResolvedValue(undefined) },
      clientId: "client-id",
    });

    expect(strategy).toBeInstanceOf(OfficeBearerSignOutStrategy);
  });

  it("throws when office dependencies are missing", () => {
    const authClient = createMockAuthClient();

    expect(() =>
      createSignOutStrategy({
        host: "office",
        authClient,
      }),
    ).toThrow(/Office sign-out requires/);
  });
});

describe("WebCookieSignOutStrategy", () => {
  it("only calls authClient.signOut", async () => {
    const authClient = createMockAuthClient();
    const strategy = new WebCookieSignOutStrategy(authClient);

    await strategy.signOut();

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
  });
});

describe("OfficeBearerSignOutStrategy", () => {
  it("clears local state and blocks silent restore even when signOut throws", async () => {
    const authClient = createMockAuthClient();
    vi.mocked(authClient.signOut).mockRejectedValue(new Error("network"));

    const bearerClear = vi.fn();
    const continuity = createInMemoryContinuity();
    const cacheClear = vi.fn().mockResolvedValue(undefined);

    const strategy = new OfficeBearerSignOutStrategy(
      authClient,
      { clear: bearerClear },
      continuity,
      { clear: cacheClear },
      "client-id",
    );

    await expect(strategy.signOut()).rejects.toThrow("network");

    expect(bearerClear).toHaveBeenCalledTimes(1);
    expect(continuity.get()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);
    expect(cacheClear).toHaveBeenCalledWith("client-id");
  });

  it("clears bearer, continuity, and MSAL cache on success", async () => {
    const authClient = createMockAuthClient();
    const bearerClear = vi.fn();
    const continuity = createInMemoryContinuity();
    const cacheClear = vi.fn().mockResolvedValue(undefined);

    const strategy = new OfficeBearerSignOutStrategy(
      authClient,
      { clear: bearerClear },
      continuity,
      { clear: cacheClear },
      "client-id",
    );

    await strategy.signOut();

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(bearerClear).toHaveBeenCalledTimes(1);
    expect(continuity.get()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);
    expect(cacheClear).toHaveBeenCalledWith("client-id");
  });
});
