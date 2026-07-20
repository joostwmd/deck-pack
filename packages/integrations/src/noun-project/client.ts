import { createHmac } from "node:crypto";
import OAuth from "oauth-1.0a";

import {
  NounProjectAuthError,
  NounProjectNetworkError,
  NounProjectNotFoundError,
  NounProjectRateLimitError,
  NounProjectUpstreamError,
} from "./errors";
import {
  NounProjectDownloadResponseSchema,
  NounProjectGetIconResponseSchema,
  NounProjectMoreLikeThisResponseSchema,
  NounProjectSearchResponseSchema,
  type GetNounIconDetailsInput,
  type NounProjectIcon,
  type NounProjectIconDetails,
  type NounProjectSearchResponse,
  type SearchNounIconsInput,
} from "./types";

export type NounProjectClientOptions = {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class NounProjectClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly oauth: OAuth;

  constructor(options: NounProjectClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.thenounproject.com";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.oauth = new OAuth({
      consumer: {
        key: options.apiKey,
        secret: options.apiSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(baseString, key) {
        return createHmac("sha1", key).update(baseString).digest("base64");
      },
    });
  }

  async searchIcons(input: SearchNounIconsInput): Promise<NounProjectSearchResponse> {
    const query = input.query.trim();
    if (!query) {
      return { icons: [] };
    }

    const publicDomainOnly = input.publicDomainOnly ?? true;
    const params: Record<string, string> = {
      query,
      limit: String(input.limit ?? 24),
      thumbnail_size: String(input.thumbnailSize ?? 200),
    };
    if (publicDomainOnly) {
      // Free-tier /download only works for public-domain icons.
      params.limit_to_public_domain = "1";
    }
    if (input.styles) {
      params.styles = input.styles;
    }

    const json = await this.requestJson("/v2/icon", params);
    const parsed = NounProjectSearchResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new NounProjectUpstreamError(200);
    }
    return parsed.data;
  }

  async getIconDetails(input: GetNounIconDetailsInput): Promise<NounProjectIconDetails> {
    const id = input.id.trim();
    if (!id) {
      throw new NounProjectNotFoundError(id);
    }

    const similarLimit = input.similarLimit ?? 4;

    const iconJson = await this.requestJson(`/v2/icon/${encodeURIComponent(id)}`, {
      thumbnail_size: "200",
    });

    const iconParsed = NounProjectGetIconResponseSchema.safeParse(iconJson);
    if (!iconParsed.success) {
      throw new NounProjectUpstreamError(200);
    }

    const primary = iconParsed.data.icon;
    const primaryPreview = primary.thumbnail_url ?? "";
    if (!primaryPreview) {
      throw new NounProjectUpstreamError(200);
    }

    // Public-domain icons can use /download on free keys → SVG for Office insert.
    const primarySvg = await this.resolveSvg(primary);

    const variants: NounProjectIconDetails["variants"] = [
      {
        id: primary.id,
        name: styleLabel(primary) || "Original",
        previewUrl: primaryPreview,
        svg: primarySvg,
      },
    ];

    if (similarLimit > 0) {
      try {
        const similarJson = await this.requestJson(
          `/v2/icon/${encodeURIComponent(id)}/more-like-this`,
          {
            limit: String(Math.max(similarLimit * 3, similarLimit)),
            thumbnail_size: "200",
            include_svg: "1",
            limit_to_public_domain: "1",
          },
        );
        const similarParsed = NounProjectMoreLikeThisResponseSchema.safeParse(similarJson);
        if (similarParsed.success) {
          const candidates = similarParsed.data.icons
            .filter(
              (icon) =>
                icon.id !== primary.id &&
                Boolean(icon.thumbnail_url) &&
                isPublicDomain(icon),
            )
            .slice(0, similarLimit);

          const similarVariants = (
            await Promise.all(
              candidates.map(async (icon) => {
                const svg = await this.resolveSvg(icon);
                // Skip PNG-only similar hits so PowerPoint never hits CDN fetch.
                if (!svg) return null;
                return {
                  id: icon.id,
                  name: icon.term?.trim() || styleLabel(icon) || icon.id,
                  previewUrl: icon.thumbnail_url ?? "",
                  svg,
                };
              }),
            )
          ).filter((variant): variant is NonNullable<typeof variant> => variant != null);

          variants.push(...similarVariants);
        }
      } catch {
        // Similar icons are optional; primary variant is enough for insert.
      }
    }

    return {
      id: primary.id,
      name: primary.term?.trim() || primary.id,
      attribution: primary.attribution ?? null,
      thumbnailUrl: primaryPreview,
      variants,
    };
  }

  /**
   * Resolve SVG markup when the API grants access.
   * Free keys: /download works for public-domain icons; CC-BY usually has no icon_url.
   */
  async resolveSvg(icon: NounProjectIcon): Promise<string | null> {
    if (icon.icon_url) {
      try {
        return await this.fetchSvgText(icon.icon_url);
      } catch {
        // Fall through.
      }
    }

    if (isPublicDomain(icon)) {
      try {
        return await this.downloadSvg(icon.id);
      } catch {
        return null;
      }
    }

    return null;
  }

  async downloadSvg(iconId: string, color?: string): Promise<string> {
    const params: Record<string, string> = { filetype: "svg" };
    if (color) {
      params.color = color.replace(/^#/, "");
    }

    const json = await this.requestJson(
      `/v2/icon/${encodeURIComponent(iconId)}/download`,
      params,
    );
    const parsed = NounProjectDownloadResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new NounProjectUpstreamError(200);
    }

    return Buffer.from(parsed.data.base64_encoded_file, "base64").toString("utf8");
  }

  private async fetchSvgText(svgUrl: string): Promise<string> {
    let response: Response;
    try {
      response = await this.fetchImpl(svgUrl, { method: "GET" });
    } catch (error) {
      throw new NounProjectNetworkError(error);
    }

    if (!response.ok) {
      throw new NounProjectUpstreamError(response.status);
    }

    const text = await response.text();
    if (!text.includes("<svg")) {
      throw new NounProjectUpstreamError(response.status);
    }
    return text;
  }

  private async requestJson(
    path: string,
    params: Record<string, string> = {},
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const authHeader = this.sign("GET", url);
    let response: Response;

    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          ...authHeader,
          Accept: "application/json",
        },
      });
    } catch (error) {
      throw new NounProjectNetworkError(error);
    }

    if (response.status === 401) {
      throw new NounProjectAuthError();
    }
    if (response.status === 404) {
      throw new NounProjectNotFoundError(path);
    }
    if (response.status === 429) {
      throw new NounProjectRateLimitError();
    }
    if (!response.ok) {
      throw new NounProjectUpstreamError(response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new NounProjectUpstreamError(response.status);
    }
  }

  private sign(method: string, url: URL): { Authorization: string } {
    const requestData = {
      url: url.toString(),
      method,
    };
    const authorized = this.oauth.authorize(requestData);
    const header = this.oauth.toHeader(authorized);
    return { Authorization: header.Authorization };
  }
}

function isPublicDomain(icon: NounProjectIcon): boolean {
  return icon.license_description === "public-domain";
}

function styleLabel(icon: NounProjectIcon): string {
  const style = icon.styles?.[0]?.style;
  if (!style) return "";
  return style.charAt(0).toUpperCase() + style.slice(1);
}
