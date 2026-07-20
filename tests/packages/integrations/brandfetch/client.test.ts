import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandfetchClient } from "@deck-pack/integrations/brandfetch/client";
import {
  BrandfetchAuthError,
  BrandfetchNotFoundError,
  BrandfetchRateLimitError,
  BrandfetchUpstreamError,
} from "@deck-pack/integrations/brandfetch/errors";

function createJsonResponse(
  body: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
): Response {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

describe("BrandfetchClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("searches brands with client id query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse([
        {
          icon: "https://cdn.brandfetch.io/acme.com/icon",
          name: "Acme",
          domain: "acme.com",
          claimed: true,
          brandId: "id_acme",
        },
      ]),
    );

    const client = new BrandfetchClient({
      apiKey: "test-api-key",
      clientId: "test-client-id",
      baseUrl: "https://api.brandfetch.io/v2",
      fetchImpl: fetchMock,
    });

    const result = await client.searchBrands({ query: "acme" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://api.brandfetch.io/v2/search/acme?c=test-client-id",
    );
    expect(init.method).toBe("GET");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.domain).toBe("acme.com");
  });

  it("applies optional search limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse([
        {
          icon: null,
          name: "A",
          domain: "a.com",
          brandId: "id_a",
        },
        {
          icon: null,
          name: "B",
          domain: "b.com",
          brandId: "id_b",
        },
      ]),
    );

    const client = new BrandfetchClient({
      apiKey: "k",
      clientId: "c",
      fetchImpl: fetchMock,
    });

    const result = await client.searchBrands({ query: "ab", limit: 1 });
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.domain).toBe("a.com");
  });

  it("fetches brand details with bearer auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        id: "id_acme",
        name: "Acme",
        domain: "acme.com",
        logos: [
          {
            type: "logo",
            theme: "dark",
            formats: [
              {
                src: "https://asset.brandfetch.io/id_acme/logo.svg",
                format: "svg",
                size: 1200,
              },
            ],
          },
        ],
      }),
    );

    const client = new BrandfetchClient({
      apiKey: "test-api-key",
      clientId: "test-client-id",
      fetchImpl: fetchMock,
    });

    const result = await client.getBrandDetails({ identifier: "acme.com" });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.brandfetch.io/v2/brands/acme.com");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-api-key",
      Accept: "application/json",
    });
    expect(result.brandId).toBe("id_acme");
    expect(result.domain).toBe("acme.com");
    expect(result.logos).toHaveLength(1);
  });

  it("maps 401 to BrandfetchAuthError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ message: "Unauthorized" }, { status: 401 }));
    const client = new BrandfetchClient({
      apiKey: "bad",
      clientId: "c",
      fetchImpl: fetchMock,
    });

    await expect(client.getBrandDetails({ identifier: "acme.com" })).rejects.toBeInstanceOf(
      BrandfetchAuthError,
    );
  });

  it("maps 404 to BrandfetchNotFoundError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ message: "Not Found" }, { status: 404 }));
    const client = new BrandfetchClient({
      apiKey: "k",
      clientId: "c",
      fetchImpl: fetchMock,
    });

    await expect(client.getBrandDetails({ identifier: "missing.com" })).rejects.toBeInstanceOf(
      BrandfetchNotFoundError,
    );
  });

  it("maps 429 to BrandfetchRateLimitError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ message: "API key quota exceeded" }, { status: 429 }));
    const client = new BrandfetchClient({
      apiKey: "k",
      clientId: "c",
      fetchImpl: fetchMock,
    });

    await expect(client.searchBrands({ query: "acme" })).rejects.toBeInstanceOf(
      BrandfetchRateLimitError,
    );
  });

  it("maps unexpected status to BrandfetchUpstreamError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ message: "oops" }, { status: 500 }));
    const client = new BrandfetchClient({
      apiKey: "k",
      clientId: "c",
      fetchImpl: fetchMock,
    });

    await expect(client.searchBrands({ query: "acme" })).rejects.toBeInstanceOf(
      BrandfetchUpstreamError,
    );
  });
});
