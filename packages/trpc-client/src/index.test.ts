import { describe, expect, it, vi } from "vitest";

import { createTrpcBrowserBundle } from "./index";

describe("createTrpcBrowserBundle", () => {
  it("merges Authorization headers without dropping existing request headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: { data: { ok: true } } }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { trpcClient } = createTrpcBrowserBundle({
      trpcUrl: "http://localhost:3000/trpc",
      getAuthorizationHeader: () => "Bearer signed.session.token",
    });

    await trpcClient.healthCheck.query();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer signed.session.token");
  });

  it("omits Authorization when no bearer token is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: { data: { ok: true } } }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { trpcClient } = createTrpcBrowserBundle({
      trpcUrl: "http://localhost:3000/trpc",
      getAuthorizationHeader: () => null,
    });

    await trpcClient.healthCheck.query();

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBeNull();
  });
});
