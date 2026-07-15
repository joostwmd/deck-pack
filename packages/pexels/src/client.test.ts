import { afterEach, describe, expect, it, vi } from "vitest";

import { PexelsClient } from "./client";
import {
  PexelsAuthError,
  PexelsRateLimitError,
  PexelsUpstreamError,
} from "./errors";

const samplePhoto = {
  id: 2014422,
  width: 3024,
  height: 3024,
  url: "https://www.pexels.com/photo/brown-rocks-during-golden-hour-2014422/",
  photographer: "Joey Farina",
  photographer_url: "https://www.pexels.com/@joey",
  photographer_id: 680589,
  avg_color: "#978E82",
  src: {
    original: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg",
    large2x:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    large:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    medium:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=350",
    small:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=130",
    portrait:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    landscape:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tiny:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
  },
  alt: "Brown Rocks During Golden Hour",
};

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

describe("PexelsClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serializes search query and optional filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        page: 1,
        per_page: 24,
        total_results: 1,
        photos: [samplePhoto],
      }),
    );

    const client = new PexelsClient("test-key", "https://api.pexels.com/v1", fetchMock);

    await client.searchPhotos({
      query: "ocean",
      orientation: "landscape",
      size: "large",
      color: "#112233",
      locale: "en-US",
      page: 2,
      perPage: 24,
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://api.pexels.com/v1/search?query=ocean&orientation=landscape&size=large&color=%23112233&locale=en-US&page=2&per_page=24",
    );
    expect(init.headers).toEqual({ Authorization: "test-key" });
  });

  it("parses successful search responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        page: 1,
        per_page: 24,
        total_results: 100,
        next_page: "https://api.pexels.com/v1/search?page=2&per_page=24&query=nature",
        photos: [samplePhoto],
      }),
    );

    const client = new PexelsClient("test-key", "https://api.pexels.com/v1", fetchMock);
    const response = await client.searchPhotos({ query: "nature" });

    expect(response.photos).toHaveLength(1);
    expect(response.photos[0]?.id).toBe(2014422);
    expect(response.total_results).toBe(100);
    expect(response.next_page).toContain("page=2");
  });

  it("throws auth errors for 401 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}, { status: 401 }));

    const client = new PexelsClient("bad-key", "https://api.pexels.com/v1", fetchMock);

    await expect(client.searchPhotos({ query: "nature" })).rejects.toBeInstanceOf(
      PexelsAuthError,
    );
  });

  it("throws rate-limit errors with reset metadata for 429 responses", async () => {
    const reset = 1_700_000_000;
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {},
        {
          status: 429,
          headers: {
            "X-Ratelimit-Limit": "200",
            "X-Ratelimit-Remaining": "0",
            "X-Ratelimit-Reset": String(reset),
          },
        },
      ),
    );

    const client = new PexelsClient("test-key", "https://api.pexels.com/v1", fetchMock);

    await expect(client.searchPhotos({ query: "nature" })).rejects.toMatchObject({
      name: "PexelsRateLimitError",
      rateLimit: {
        limit: 200,
        remaining: 0,
        reset,
      },
    } satisfies Partial<PexelsRateLimitError>);
  });

  it("throws upstream errors for 5xx responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}, { status: 503 }));

    const client = new PexelsClient("test-key", "https://api.pexels.com/v1", fetchMock);

    await expect(client.searchPhotos({ query: "nature" })).rejects.toBeInstanceOf(
      PexelsUpstreamError,
    );
  });
});
