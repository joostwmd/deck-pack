import { describe, expect, it, vi } from "vitest";

import {
  captureBearerTokenFromResponse,
  type BearerSessionStore,
} from "@deck-pack/auth/client";

function createBearerStore(): BearerSessionStore {
  return {
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
}

describe("captureBearerTokenFromResponse", () => {
  it("does not capture an unsigned response body token", () => {
    const store = createBearerStore();

    captureBearerTokenFromResponse(store, new Response(null));

    expect(store.setToken).not.toHaveBeenCalled();
  });

  it("captures the signed token from the response header", () => {
    const store = createBearerStore();

    captureBearerTokenFromResponse(
      store,
      new Response(null, {
        headers: { "set-auth-token": "signed-bearer-token" },
      }),
    );

    expect(store.setToken).toHaveBeenCalledWith("signed-bearer-token");
  });
});
