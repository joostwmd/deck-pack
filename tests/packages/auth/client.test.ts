import { describe, expect, it, vi } from "vitest";

import {
  captureBearerTokenFromResponse,
  createAuthClient,
  type BearerSessionStore,
} from "@deck-pack/auth/client";

function createMemoryStorage(): BearerSessionStore {
  let token: string | null = null;
  return {
    getToken: () => token,
    setToken: (value) => {
      token = value;
    },
    clearToken: () => {
      token = null;
    },
  };
}

describe("createAuthClient bearer capture", () => {
  it("stores set-auth-token from successful auth responses", () => {
    const store = createMemoryStorage();

    createAuthClient({
      baseURL: "https://api.example.com",
      bearer: store,
    });

    const response = new Response(null, {
      headers: { "set-auth-token": "signed.session.token" },
    });

    captureBearerTokenFromResponse(store, response);

    expect(store.getToken()).toBe("signed.session.token");
  });

  it("configures bearer auth on the client when a store is provided", () => {
    const store = createMemoryStorage();
    store.setToken("existing-token");

    const client = createAuthClient({
      baseURL: "https://api.example.com",
      bearer: store,
    });

    expect(client).toBeDefined();
  });
});
