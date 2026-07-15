import { beforeEach, describe, expect, it, vi } from "vitest";

const { createReactAuthClient } = vi.hoisted(() => ({
  createReactAuthClient: vi.fn(),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: createReactAuthClient,
}));

vi.mock("better-auth/client/plugins", () => ({
  adminClient: vi.fn(() => ({})),
  emailOTPClient: vi.fn(() => ({})),
  organizationClient: vi.fn(() => ({})),
}));

import { createAppAuthClient, type BearerSessionStore } from "./client";

function createBearerStore(): BearerSessionStore {
  return {
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
}

function getOnSuccess(store: BearerSessionStore) {
  createAppAuthClient({ baseURL: "https://api.example.com", bearer: store });

  const config = createReactAuthClient.mock.calls.at(-1)?.[0] as {
    fetchOptions?: {
      onSuccess?: (context: { response: Response; data: unknown }) => void;
    };
  };

  return config.fetchOptions?.onSuccess;
}

describe("createAppAuthClient bearer capture", () => {
  beforeEach(() => {
    createReactAuthClient.mockReset();
  });

  it("does not capture an unsigned response body token", () => {
    const store = createBearerStore();
    const onSuccess = getOnSuccess(store);

    onSuccess?.({
      response: new Response(null),
      data: { token: "raw-session-token" },
    });

    expect(store.setToken).not.toHaveBeenCalled();
  });

  it("captures the signed token from the response header", () => {
    const store = createBearerStore();
    const onSuccess = getOnSuccess(store);

    onSuccess?.({
      response: new Response(null, {
        headers: { "set-auth-token": "signed-bearer-token" },
      }),
      data: { token: "raw-session-token" },
    });

    expect(store.setToken).toHaveBeenCalledWith("signed-bearer-token");
  });
});
