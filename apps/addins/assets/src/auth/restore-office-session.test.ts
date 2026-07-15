import { beforeEach, describe, expect, it, vi } from "vitest";

const acquireMicrosoftTokensSilently = vi.fn();
const isNaaSupported = vi.fn();
const useOfficeBearerMode = vi.fn();
const getBearerToken = vi.fn();

vi.mock("@deck-pack/env/web", () => ({
  env: { VITE_MICROSOFT_CLIENT_ID: "client-id" },
}));

vi.mock("@/auth/microsoft-naa", () => ({
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
}));

async function loadRestoreModule() {
  vi.resetModules();
  return import("./restore-office-session");
}

function createAuthClient(signInResult: { error: { message?: string } | null }) {
  return {
    signIn: {
      social: vi.fn().mockResolvedValue(signInResult),
    },
  } as never;
}

describe("restoreOfficeSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOfficeBearerMode.mockReturnValue(true);
    isNaaSupported.mockReturnValue(true);
    acquireMicrosoftTokensSilently.mockResolvedValue({
      idToken: "id-token",
      accessToken: "access-token",
    });
    getBearerToken.mockReturnValue("bearer-token");
  });

  it("restores the session via silent NAA sign-in", async () => {
    const { restoreOfficeSession } = await loadRestoreModule();
    const authClient = createAuthClient({ error: null });

    await expect(restoreOfficeSession(authClient)).resolves.toBe(true);
    expect(acquireMicrosoftTokensSilently).toHaveBeenCalledWith("client-id");
  });

  it("returns false outside Office bearer mode", async () => {
    useOfficeBearerMode.mockReturnValue(false);
    const { restoreOfficeSession } = await loadRestoreModule();

    await expect(restoreOfficeSession(createAuthClient({ error: null }))).resolves.toBe(false);
    expect(acquireMicrosoftTokensSilently).not.toHaveBeenCalled();
  });

  it("returns false when NAA is unsupported", async () => {
    isNaaSupported.mockReturnValue(false);
    const { restoreOfficeSession } = await loadRestoreModule();

    await expect(restoreOfficeSession(createAuthClient({ error: null }))).resolves.toBe(false);
  });

  it("returns false when silent token acquisition fails", async () => {
    acquireMicrosoftTokensSilently.mockRejectedValue(new Error("no account"));
    const { restoreOfficeSession } = await loadRestoreModule();

    await expect(restoreOfficeSession(createAuthClient({ error: null }))).resolves.toBe(false);
  });

  it("returns false when the server sign-in fails", async () => {
    const { restoreOfficeSession } = await loadRestoreModule();
    const authClient = createAuthClient({ error: { message: "denied" } });

    await expect(restoreOfficeSession(authClient)).resolves.toBe(false);
  });

  it("only attempts restore once per lifetime", async () => {
    const { restoreOfficeSession } = await loadRestoreModule();
    const authClient = createAuthClient({ error: null });

    await restoreOfficeSession(authClient);
    await restoreOfficeSession(authClient);

    expect(acquireMicrosoftTokensSilently).toHaveBeenCalledTimes(1);
  });
});
