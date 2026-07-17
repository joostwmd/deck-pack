import { describe, expect, it, vi } from "vitest";

import {
  OfficeNaaMicrosoftSignInStrategy,
  WebMicrosoftSignInStrategy,
  createMicrosoftSignInStrategy,
} from "@/auth/microsoft-sign-in-strategy";

vi.mock("@/auth/microsoft-naa", () => ({
  acquireMicrosoftTokens: vi.fn().mockResolvedValue({
    idToken: "id-token",
    accessToken: "access-token",
  }),
  checkNaaBrokerAvailable: vi.fn().mockResolvedValue(true),
  isNestedAppAuthBridgePresent: vi.fn().mockReturnValue(true),
}));

function createMockAuthClient() {
  return {
    signIn: {
      social: vi.fn(),
    },
  } as unknown as ReturnType<
    typeof import("@deck-pack/auth/client").createAppAuthClient
  >;
}

describe("createMicrosoftSignInStrategy", () => {
  it("returns web redirect strategy in browser preview", () => {
    const authClient = createMockAuthClient();
    const strategy = createMicrosoftSignInStrategy({
      authClient,
      environment: "web",
      isNaaSupported: false,
      callbackURL: "https://localhost:3003/auth/callback",
      clientId: "client-id",
    });

    expect(strategy).toBeInstanceOf(WebMicrosoftSignInStrategy);
  });

  it("returns office NAA strategy when nested auth is supported", () => {
    const authClient = createMockAuthClient();
    const strategy = createMicrosoftSignInStrategy({
      authClient,
      environment: "office",
      isNaaSupported: true,
      callbackURL: "https://localhost:3003/auth/callback",
      clientId: "client-id",
    });

    expect(strategy).toBeInstanceOf(OfficeNaaMicrosoftSignInStrategy);
  });

  it("returns null for office hosts without NAA support", () => {
    const authClient = createMockAuthClient();
    const strategy = createMicrosoftSignInStrategy({
      authClient,
      environment: "office",
      isNaaSupported: false,
      callbackURL: "https://localhost:3003/auth/callback",
      clientId: "client-id",
    });

    expect(strategy).toBeNull();
  });

  it("returns null for office hosts when the Microsoft client id is missing", () => {
    const authClient = createMockAuthClient();
    const strategy = createMicrosoftSignInStrategy({
      authClient,
      environment: "office",
      isNaaSupported: true,
      callbackURL: "https://localhost:3003/auth/callback",
      clientId: undefined,
    });

    expect(strategy).toBeNull();
  });
});

describe("WebMicrosoftSignInStrategy", () => {
  it("starts the Better Auth redirect flow", async () => {
    const authClient = createMockAuthClient();
    vi.mocked(authClient.signIn.social).mockResolvedValue({ data: null, error: null });

    const strategy = new WebMicrosoftSignInStrategy(
      authClient,
      "https://localhost:3003/auth/callback",
    );
    const result = await strategy.signIn();

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "microsoft",
      callbackURL: "https://localhost:3003/auth/callback",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns an error when Better Auth rejects the redirect", async () => {
    const authClient = createMockAuthClient();
    vi.mocked(authClient.signIn.social).mockResolvedValue({
      data: null,
      error: { message: "Provider unavailable" },
    });

    const strategy = new WebMicrosoftSignInStrategy(
      authClient,
      "https://localhost:3003/auth/callback",
    );
    const result = await strategy.signIn();

    expect(result).toEqual({
      ok: false,
      error: "Provider unavailable",
    });
  });
});

describe("OfficeNaaMicrosoftSignInStrategy", () => {
  it("prefers the captured signed bearer token over the raw response body token", async () => {
    const authClient = createMockAuthClient();
    vi.mocked(authClient.signIn.social).mockResolvedValue({
      data: { token: "raw-session-token" },
      error: null,
    });

    const strategy = new OfficeNaaMicrosoftSignInStrategy(
      authClient,
      "client-id",
      () => "signed-bearer-token",
    );
    const result = await strategy.signIn();

    expect(result).toEqual({ ok: true, bearerToken: "signed-bearer-token" });
  });

  it("uses the captured bearer token when the response body omits token", async () => {
    const authClient = createMockAuthClient();
    vi.mocked(authClient.signIn.social).mockResolvedValue({ data: {}, error: null });

    const strategy = new OfficeNaaMicrosoftSignInStrategy(
      authClient,
      "client-id",
      () => "captured-bearer-token",
    );
    const result = await strategy.signIn();

    expect(result).toEqual({ ok: true, bearerToken: "captured-bearer-token" });
  });
});
