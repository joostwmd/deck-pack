import {
  BrandfetchAuthError,
  BrandfetchNetworkError,
  BrandfetchNotFoundError,
  BrandfetchRateLimitError,
  BrandfetchUpstreamError,
} from "./errors";
import {
  BrandfetchBrandApiResponseSchema,
  BrandfetchSearchHitSchema,
  type BrandfetchDetailsResponse,
  type BrandfetchSearchResponse,
  type GetBrandDetailsInput,
  type SearchBrandsInput,
} from "./types";
import { z } from "zod";

export type BrandfetchClientOptions = {
  apiKey: string;
  clientId: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class BrandfetchClient {
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BrandfetchClientOptions) {
    this.apiKey = options.apiKey;
    this.clientId = options.clientId;
    this.baseUrl = options.baseUrl ?? "https://api.brandfetch.io/v2";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async searchBrands(input: SearchBrandsInput): Promise<BrandfetchSearchResponse> {
    const query = input.query.trim();
    if (!query) {
      return { results: [] };
    }

    const url = new URL(`${this.baseUrl}/search/${encodeURIComponent(query)}`);
    url.searchParams.set("c", this.clientId);

    const response = await this.request(url, { method: "GET" });

    if (response.status === 401) {
      throw new BrandfetchAuthError();
    }
    if (response.status === 429) {
      throw new BrandfetchRateLimitError();
    }
    if (!response.ok) {
      throw new BrandfetchUpstreamError(response.status);
    }

    const json = await this.readJson(response);
    const parsed = z.array(BrandfetchSearchHitSchema).safeParse(json);
    if (!parsed.success) {
      throw new BrandfetchUpstreamError(response.status);
    }

    let results = parsed.data;
    if (input.limit != null && input.limit > 0) {
      results = results.slice(0, input.limit);
    }

    return { results };
  }

  async getBrandDetails(input: GetBrandDetailsInput): Promise<BrandfetchDetailsResponse> {
    const identifier = input.identifier.trim();
    if (!identifier) {
      throw new BrandfetchNotFoundError(identifier);
    }

    const url = new URL(`${this.baseUrl}/brands/${encodeURIComponent(identifier)}`);

    const response = await this.request(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401) {
      throw new BrandfetchAuthError();
    }
    if (response.status === 404) {
      throw new BrandfetchNotFoundError(identifier);
    }
    if (response.status === 429) {
      throw new BrandfetchRateLimitError();
    }
    if (!response.ok) {
      throw new BrandfetchUpstreamError(response.status);
    }

    const json = await this.readJson(response);
    const parsed = BrandfetchBrandApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new BrandfetchUpstreamError(response.status);
    }

    return {
      brandId: parsed.data.id,
      name: parsed.data.name ?? null,
      domain: parsed.data.domain,
      logos: parsed.data.logos,
    };
  }

  private async request(url: URL, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchImpl(url, init);
    } catch (error) {
      throw new BrandfetchNetworkError(error);
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new BrandfetchUpstreamError(response.status);
    }
  }
}
