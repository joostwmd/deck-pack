import { describe, expect, it } from "vitest";

import {
  GetLogoDetails,
  InMemoryLogoIntegration,
  LogoNotFoundError,
  SearchLogos,
  type LogoDetailsResponse,
} from "@deck-pack/logos";

function seedLogo(overrides?: Partial<LogoDetailsResponse>): LogoDetailsResponse {
  return {
    id: "acme.com",
    name: "Acme Corp",
    imageUrl: "https://cdn.example/acme.png",
    variants: [
      {
        id: "logo-light-0",
        imageUrl: "https://cdn.example/acme.png",
        name: "Logo - Light",
        insert: { type: "image", imageUrl: "https://cdn.example/acme.png" },
      },
    ],
    metadata: {
      TYPE: "logo",
      BRAND_ID: "brand-1",
      BRAND_NAME: "Acme Corp",
      BRAND_DOMAIN: "acme.com",
      STOCK_TICKERS: "",
    },
    ...overrides,
  };
}

describe("logos use-cases", () => {
  it("searches seeded logos by name", async () => {
    const integration = new InMemoryLogoIntegration();
    integration.seed([
      seedLogo(),
      seedLogo({
        id: "other.com",
        name: "Other Brand",
        imageUrl: "https://cdn.example/other.png",
      }),
    ]);

    const result = await new SearchLogos(integration).execute({ query: "acme" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      id: "acme.com",
      imageUrl: "https://cdn.example/acme.png",
      name: "Acme Corp",
    });
  });

  it("returns logo details for a known identifier", async () => {
    const integration = new InMemoryLogoIntegration();
    const seeded = seedLogo();
    integration.seed([seeded]);

    const result = await new GetLogoDetails(integration).execute({ externalId: "acme.com" });

    expect(result).toEqual(seeded);
  });

  it("throws LogoNotFoundError when details are missing", async () => {
    const integration = new InMemoryLogoIntegration();

    await expect(
      new GetLogoDetails(integration).execute({ externalId: "missing.com" }),
    ).rejects.toBeInstanceOf(LogoNotFoundError);
  });
});
