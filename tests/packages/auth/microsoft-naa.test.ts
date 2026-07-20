import { afterEach, describe, expect, it, vi } from "vitest";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

const { acquireTokenSilent, acquireTokenPopup } = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  acquireTokenPopup: vi.fn(),
}));

vi.mock("@azure/msal-browser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@azure/msal-browser")>();

  return {
    ...actual,
    createNestablePublicClientApplication: vi.fn().mockResolvedValue({
      acquireTokenSilent,
      acquireTokenPopup,
    }),
  };
});

import {
  acquireMicrosoftTokens,
  checkNaaBrokerAvailable,
  isNestedAppAuthBridgePresent,
} from "@deck-pack/auth/microsoft-naa";

describe("isNestedAppAuthBridgePresent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when Office has not injected the bridge", () => {
    vi.stubGlobal("window", {} as Window & typeof globalThis);

    expect(isNestedAppAuthBridgePresent()).toBe(false);
  });

  it("returns true when nestedAppAuthBridge exists", async () => {
    vi.stubGlobal("window", {
      nestedAppAuthBridge: {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
      },
    } as unknown as Window & typeof globalThis);

    expect(isNestedAppAuthBridgePresent()).toBe(true);
    await expect(checkNaaBrokerAvailable()).resolves.toBe(true);
  });
});

describe("acquireMicrosoftTokens", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to popup when silent fails with ServerError", async () => {
    vi.stubGlobal("window", {
      nestedAppAuthBridge: {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
      },
    } as unknown as Window & typeof globalThis);

    acquireTokenSilent.mockRejectedValue({
      name: "ServerError",
      errorCode: "",
      errorMessage: "",
      subError: "",
    });
    acquireTokenPopup.mockResolvedValue({
      idToken: "id-token",
      accessToken: "access-token",
    });

    const result = await acquireMicrosoftTokens("client-id");

    expect(acquireTokenPopup).toHaveBeenCalledOnce();
    expect(result.idToken).toBe("id-token");
  });

  it("falls back to popup when silent fails with InteractionRequiredAuthError", async () => {
    vi.stubGlobal("window", {
      nestedAppAuthBridge: {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
      },
    } as unknown as Window & typeof globalThis);

    acquireTokenSilent.mockRejectedValue(
      new InteractionRequiredAuthError("interaction_required"),
    );
    acquireTokenPopup.mockResolvedValue({
      idToken: "id-token",
      accessToken: "access-token",
    });

    await acquireMicrosoftTokens("client-id");

    expect(acquireTokenPopup).toHaveBeenCalledOnce();
  });
});
