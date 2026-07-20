import { z } from "zod";

import {
  PexelsAuthError,
  PexelsNetworkError,
  PexelsRateLimitError,
  PexelsUpstreamError,
} from "./errors";
import type { PexelsRateLimitInfo, PexelsSearchResponse, SearchPhotosInput } from "./types";

const pexelsPhotoSrcSchema = z.object({
  original: z.string().url(),
  large2x: z.string().url(),
  large: z.string().url(),
  medium: z.string().url(),
  small: z.string().url(),
  portrait: z.string().url(),
  landscape: z.string().url(),
  tiny: z.string().url(),
});

const pexelsPhotoSchema = z.object({
  id: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  url: z.string().url(),
  photographer: z.string(),
  photographer_url: z.string().url(),
  photographer_id: z.number().int(),
  avg_color: z.string(),
  src: pexelsPhotoSrcSchema,
  alt: z.string(),
});

const pexelsSearchResponseSchema = z.object({
  page: z.number().int(),
  per_page: z.number().int(),
  total_results: z.number().int(),
  next_page: z.string().url().optional(),
  prev_page: z.string().url().optional(),
  photos: z.array(pexelsPhotoSchema),
});

function parseRateLimitHeader(value: string | null): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRateLimitInfo(response: Response): PexelsRateLimitInfo {
  return {
    limit: parseRateLimitHeader(response.headers.get("X-Ratelimit-Limit")),
    remaining: parseRateLimitHeader(response.headers.get("X-Ratelimit-Remaining")),
    reset: parseRateLimitHeader(response.headers.get("X-Ratelimit-Reset")),
  };
}

export class PexelsClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.pexels.com/v1",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async searchPhotos(input: SearchPhotosInput): Promise<PexelsSearchResponse> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set("query", input.query);

    if (input.orientation) {
      url.searchParams.set("orientation", input.orientation);
    }

    if (input.size) {
      url.searchParams.set("size", input.size);
    }

    if (input.color) {
      url.searchParams.set("color", input.color);
    }

    if (input.locale) {
      url.searchParams.set("locale", input.locale);
    }

    url.searchParams.set("page", String(input.page ?? 1));
    url.searchParams.set("per_page", String(input.perPage ?? 24));

    let response: Response;

    try {
      response = await this.fetchImpl(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });
    } catch (error) {
      throw new PexelsNetworkError(error);
    }

    if (response.status === 401) {
      throw new PexelsAuthError();
    }

    if (response.status === 429) {
      throw new PexelsRateLimitError(readRateLimitInfo(response));
    }

    if (!response.ok) {
      throw new PexelsUpstreamError(response.status);
    }

    let json: unknown;

    try {
      json = await response.json();
    } catch {
      throw new PexelsUpstreamError(response.status);
    }

    const parsed = pexelsSearchResponseSchema.safeParse(json);

    if (!parsed.success) {
      throw new PexelsUpstreamError(response.status);
    }

    return parsed.data;
  }
}
