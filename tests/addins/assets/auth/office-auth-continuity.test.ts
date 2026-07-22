import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALLOW_SILENT_RESTORE,
  OfficeBearerSignOutStrategy,
  REQUIRE_EXPLICIT_SIGN_IN,
  markExplicitSignIn,
} from "@deck-pack/auth/microsoft-sign-in";

/**
 * Documents the PowerPoint sign-out continuity flow as automated scenarios.
 * Manual checklist: sign out → close pane → reopen must stay logged out;
 * explicit sign-in re-enables silent restore when bearer expires.
 */
const acquireMicrosoftTokensSilently = vi.fn();
const isNaaSupported = vi.fn();
const useOfficeBearerMode = vi.fn();
const getBearerToken = vi.fn();

vi.mock("@deck-pack/env/web", () => ({
  env: { VITE_MICROSOFT_CLIENT_ID: "client-id" },
}));

vi.mock("@deck-pack/auth/microsoft-naa", () => ({
  acquireMicrosoftTokensSilently: (...args: unknown[]) =>
    acquireMicrosoftTokensSilently(...args),
}));

vi.mock("@/auth/naa-support", () => ({
  isNaaSupported: () => isNaaSupported(),
}));

vi.mock("@/auth/office-auth-mode", () => ({
  useOfficeBearerMode: () => useOfficeBearerMode(),
}));

vi.mock("@/auth/bearer-session-store", () => ({
  getBearerToken: () => getBearerToken(),
  clearBearerToken: vi.fn(),
}));

function createInMemoryContinuity() {
  let value = ALLOW_SILENT_RESTORE;
  return {
    get: () => value,
    set: (next: typeof value) => {
      value = next;
    },
  };
}

const continuity = createInMemoryContinuity();

vi.mock("@/auth/session-continuity-store", () => ({
  sessionContinuityStore: continuity,
}));

async function loadRestoreModule() {
  vi.resetModules();
  return import("@/auth/restore-office-session");
}

function createAuthClient() {
  return {
    signOut: vi.fn().mockResolvedValue(undefined),
    signIn: {
      social: vi.fn().mockResolvedValue({ error: null }),
    },
  } as never;
}

describe("Office auth continuity flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    continuity.set(ALLOW_SILENT_RESTORE);
    useOfficeBearerMode.mockReturnValue(true);
    isNaaSupported.mockReturnValue(true);
    acquireMicrosoftTokensSilently.mockResolvedValue({
      idToken: "id-token",
      accessToken: "access-token",
    });
    getBearerToken.mockReturnValue(null);
  });

  it("sign out blocks silent restore on next pane open", async () => {
    const authClient = createAuthClient();
    const bearerClear = vi.fn();
    const cacheClear = vi.fn().mockResolvedValue(undefined);

    const signOut = new OfficeBearerSignOutStrategy(
      authClient,
      { clear: bearerClear },
      continuity,
      { clear: cacheClear },
      "client-id",
    );

    await signOut.signOut();

    expect(continuity.get()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);

    const { restoreOfficeSession } = await loadRestoreModule();
    await expect(restoreOfficeSession(authClient)).resolves.toBe(false);
    expect(acquireMicrosoftTokensSilently).not.toHaveBeenCalled();
  });

  it("explicit sign-in re-enables silent restore when bearer is missing", async () => {
    continuity.set(REQUIRE_EXPLICIT_SIGN_IN);
    markExplicitSignIn(continuity);
    getBearerToken.mockReturnValue("fresh-bearer");

    const { restoreOfficeSession } = await loadRestoreModule();
    const authClient = createAuthClient();

    await expect(restoreOfficeSession(authClient)).resolves.toBe(true);
    expect(acquireMicrosoftTokensSilently).toHaveBeenCalledWith("client-id");
  });

  it("silent restore still works when bearer expired but user did not sign out", async () => {
    continuity.set(ALLOW_SILENT_RESTORE);
    getBearerToken.mockReturnValue("restored-bearer");

    const { restoreOfficeSession } = await loadRestoreModule();
    const authClient = createAuthClient();

    await expect(restoreOfficeSession(authClient)).resolves.toBe(true);
    expect(acquireMicrosoftTokensSilently).toHaveBeenCalledWith("client-id");
  });
});
