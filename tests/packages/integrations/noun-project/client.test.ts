import { afterEach, describe, expect, it, vi } from "vitest";

import { NounProjectClient } from "@deck-pack/integrations/noun-project/client";
import {
  NounProjectAuthError,
  NounProjectNotFoundError,
  NounProjectRateLimitError,
} from "@deck-pack/integrations/noun-project/errors";

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

const sampleIcon = {
  id: "1234",
  term: "Arrow",
  thumbnail_url: "https://static.thenounproject.com/png/1234-200.png",
  attribution: "Arrow by Artist from Noun Project",
  license_description: "public-domain",
  styles: [{ style: "line", line_weight: 8 }],
};

describe("NounProjectClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("searches public-domain icons with oauth authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        icons: [sampleIcon],
        total: 1,
      }),
    );

    const client = new NounProjectClient({
      apiKey: "test-key",
      apiSecret: "test-secret",
      fetchImpl: fetchMock,
    });

    const result = await client.searchIcons({ query: "arrow", limit: 10 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toContain("https://api.thenounproject.com/v2/icon?");
    expect(url.searchParams.get("query")).toBe("arrow");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("limit_to_public_domain")).toBe("1");
    expect(String((init.headers as Record<string, string>).Authorization)).toMatch(/^OAuth /);
    expect(result.icons).toHaveLength(1);
    expect(result.icons[0]?.id).toBe("1234");
  });

  it("can opt out of public-domain-only search", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ icons: [], total: 0 }));
    const client = new NounProjectClient({
      apiKey: "test-key",
      apiSecret: "test-secret",
      fetchImpl: fetchMock,
    });

    await client.searchIcons({ query: "arrow", publicDomainOnly: false });

    const [url] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.get("limit_to_public_domain")).toBeNull();
  });

  it("downloads svg for public-domain icons and skips non-pd similar variants", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const encoded = Buffer.from(svg, "utf8").toString("base64");

    const fetchMock = vi.fn().mockImplementation(async (input: URL | string) => {
      const href = typeof input === "string" ? input : input.toString();
      if (href.includes("/download")) {
        return createJsonResponse({
          base64_encoded_file: encoded,
          content_type: "image/svg+xml",
        });
      }
      if (href.includes("/more-like-this")) {
        expect(new URL(href).searchParams.get("limit_to_public_domain")).toBe("1");
        return createJsonResponse({
          icons: [
            {
              id: "5678",
              term: "Pointer",
              thumbnail_url: "https://static.thenounproject.com/png/5678-200.png",
              license_description: "public-domain",
              styles: [{ style: "solid" }],
            },
            {
              id: "9999",
              term: "CC Only",
              thumbnail_url: "https://static.thenounproject.com/png/9999-200.png",
              license_description: "creative-commons-attribution",
              styles: [{ style: "solid" }],
            },
          ],
        });
      }
      if (href.includes("/v2/icon/1234")) {
        return createJsonResponse({ icon: sampleIcon });
      }
      throw new Error(`Unexpected URL: ${href}`);
    });

    const client = new NounProjectClient({
      apiKey: "test-key",
      apiSecret: "test-secret",
      fetchImpl: fetchMock,
    });

    const details = await client.getIconDetails({ id: "1234", similarLimit: 2 });

    expect(details.variants[0]?.svg).toContain("<svg");
    expect(details.variants.some((v) => v.id === "5678" && v.svg)).toBe(true);
    expect(details.variants.some((v) => v.id === "9999")).toBe(false);
  });

  it("fetches svg from icon_url when present", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const fetchMock = vi.fn().mockImplementation(async (input: URL | string) => {
      const href = typeof input === "string" ? input : input.toString();
      if (href.includes("svg_clean")) {
        return new Response(svg, {
          status: 200,
          headers: { "Content-Type": "image/svg+xml" },
        });
      }
      if (href.includes("/v2/icon/1234")) {
        return createJsonResponse({
          icon: {
            ...sampleIcon,
            icon_url: "https://static.thenounproject.com/svg_clean/1234.svg",
          },
        });
      }
      throw new Error(`Unexpected URL: ${href}`);
    });

    const client = new NounProjectClient({
      apiKey: "test-key",
      apiSecret: "test-secret",
      fetchImpl: fetchMock,
    });

    const details = await client.getIconDetails({ id: "1234", similarLimit: 0 });
    expect(details.variants[0]?.svg).toContain("<svg");
  });

  it("maps 401 to NounProjectAuthError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ message: "Unauthorized" }, { status: 401 }));
    const client = new NounProjectClient({
      apiKey: "bad",
      apiSecret: "bad",
      fetchImpl: fetchMock,
    });

    await expect(client.searchIcons({ query: "arrow" })).rejects.toBeInstanceOf(
      NounProjectAuthError,
    );
  });

  it("maps 404 to NounProjectNotFoundError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ message: "Not Found" }, { status: 404 }));
    const client = new NounProjectClient({
      apiKey: "k",
      apiSecret: "s",
      fetchImpl: fetchMock,
    });

    await expect(client.downloadSvg("missing")).rejects.toBeInstanceOf(NounProjectNotFoundError);
  });

  it("maps 429 to NounProjectRateLimitError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ message: "Rate limited" }, { status: 429 }));
    const client = new NounProjectClient({
      apiKey: "k",
      apiSecret: "s",
      fetchImpl: fetchMock,
    });

    await expect(client.searchIcons({ query: "arrow" })).rejects.toBeInstanceOf(
      NounProjectRateLimitError,
    );
  });
});
