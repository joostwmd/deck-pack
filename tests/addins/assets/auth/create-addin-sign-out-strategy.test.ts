import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  OfficeBearerSignOutStrategy,
  WebCookieSignOutStrategy,
} from "@deck-pack/auth/microsoft-sign-in";

const useOfficeBearerMode = vi.fn();
const getAuthClient = vi.fn();
const clearBearerToken = vi.fn();

vi.mock("@deck-pack/env/web", () => ({
  env: { VITE_MICROSOFT_CLIENT_ID: "client-id" },
}));

vi.mock("@/auth/office-auth-mode", () => ({
  useOfficeBearerMode: () => useOfficeBearerMode(),
}));

vi.mock("@/utils/auth", () => ({
  getAuthClient: () => getAuthClient(),
}));

vi.mock("@/auth/bearer-session-store", () => ({
  clearBearerToken: () => clearBearerToken(),
}));

const getSessionContinuity = vi.fn();
const setSessionContinuity = vi.fn();

vi.mock("@/auth/session-continuity-store", () => ({
  sessionContinuityStore: {
    get: () => getSessionContinuity(),
    set: (...args: unknown[]) => setSessionContinuity(...args),
  },
}));

const msalClear = vi.fn().mockResolvedValue(undefined);

vi.mock("@deck-pack/auth/microsoft-sign-in", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@deck-pack/auth/microsoft-sign-in")>();

  return {
    ...actual,
    MsalNestableTokenCache: class {
      clear = msalClear;
    },
  };
});

async function loadFactory() {
  vi.resetModules();
  return import("@/auth/create-addin-sign-out-strategy");
}

function createMockAuthClient() {
  return {
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

describe("createAddinSignOutStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthClient.mockReturnValue(createMockAuthClient());
    getSessionContinuity.mockReturnValue({ mode: "allow-silent-restore" });
  });

  it("returns web cookie strategy outside Office bearer mode", async () => {
    useOfficeBearerMode.mockReturnValue(false);
    const { createAddinSignOutStrategy } = await loadFactory();

    const strategy = createAddinSignOutStrategy();

    expect(strategy).toBeInstanceOf(WebCookieSignOutStrategy);
  });

  it("returns office bearer strategy in Office bearer mode", async () => {
    useOfficeBearerMode.mockReturnValue(true);
    const { createAddinSignOutStrategy } = await loadFactory();

    const strategy = createAddinSignOutStrategy();

    expect(strategy).toBeInstanceOf(OfficeBearerSignOutStrategy);
  });

  it("allows host override for tests", async () => {
    useOfficeBearerMode.mockReturnValue(false);
    const { createAddinSignOutStrategy } = await loadFactory();
    const authClient = createMockAuthClient();

    const strategy = createAddinSignOutStrategy({
      host: "office",
      authClient: authClient as never,
    });

    expect(strategy).toBeInstanceOf(OfficeBearerSignOutStrategy);
  });

  it("office sign-out clears bearer, blocks silent restore, and clears MSAL cache", async () => {
    useOfficeBearerMode.mockReturnValue(true);
    const { createAddinSignOutStrategy } = await loadFactory();
    const authClient = createMockAuthClient();
    const strategy = createAddinSignOutStrategy({ authClient: authClient as never });

    await strategy.signOut();

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(clearBearerToken).toHaveBeenCalledTimes(1);
    expect(setSessionContinuity).toHaveBeenCalledWith({ mode: "require-explicit-sign-in" });
    expect(msalClear).toHaveBeenCalledWith("client-id");
  });
});
