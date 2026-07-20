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
  resetNestableMsalInstance,
} from "@deck-pack/auth/microsoft-naa";

type NestedAppAuthGlobal = typeof globalThis & { nestedAppAuthBridge?: unknown };

function stubNestedAppAuthBridge(): void {
  (globalThis as NestedAppAuthGlobal).nestedAppAuthBridge = {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
  };
}

function clearNestedAppAuthBridge(): void {
  delete (globalThis as NestedAppAuthGlobal).nestedAppAuthBridge;
}

describe("isNestedAppAuthBridgePresent", () => {
  afterEach(() => {
    clearNestedAppAuthBridge();
    resetNestableMsalInstance();
  });

  it("returns false when Office has not injected the bridge", () => {
    clearNestedAppAuthBridge();

    expect(isNestedAppAuthBridgePresent()).toBe(false);
  });

  it("returns true when nestedAppAuthBridge exists", async () => {
    stubNestedAppAuthBridge();

    expect(isNestedAppAuthBridgePresent()).toBe(true);
    await expect(checkNaaBrokerAvailable()).resolves.toBe(true);
  });
});

describe("acquireMicrosoftTokens", () => {
  afterEach(() => {
    vi.clearAllMocks();
    clearNestedAppAuthBridge();
    resetNestableMsalInstance();
  });

  it("falls back to popup when silent fails with ServerError", async () => {
    stubNestedAppAuthBridge();

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
    stubNestedAppAuthBridge();

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
