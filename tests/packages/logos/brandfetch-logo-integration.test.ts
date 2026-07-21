import { describe, expect, it, vi } from "vitest";

import {
  BrandfetchNotFoundError,
  BrandfetchRateLimitError,
} from "@deck-pack/integrations/brandfetch";
import {
  BrandfetchLogoIntegration,
  LogoNotFoundError,
  LogoRateLimitError,
} from "@deck-pack/logos";

describe("BrandfetchLogoIntegration", () => {
  it("maps logo search responses using domain as id", async () => {
    const searchBrands = vi.fn().mockResolvedValue({
      results: [
        {
          brandId: "id_acme",
          name: "Acme",
          domain: "acme.com",
          icon: "https://example.com/acme.png",
        },
      ],
    });
    const integration = new BrandfetchLogoIntegration({ searchBrands } as never);

    const result = await integration.search("acme");

    expect(searchBrands).toHaveBeenCalledWith({ query: "acme", limit: undefined });
    expect(result.results).toEqual([
      {
        id: "acme.com",
        name: "Acme",
        imageUrl: "https://example.com/acme.png",
      },
    ]);
  });

  it("maps logo details responses", async () => {
    const getBrandDetails = vi.fn().mockResolvedValue({
      brandId: "id_acme",
      name: "Acme",
      domain: "acme.com",
      logos: [
        {
          type: "logo",
          theme: "dark",
          formats: [
            { format: "png", src: "https://example.com/acme-dark.png" },
            { format: "svg", src: "https://example.com/acme-dark.svg" },
          ],
        },
      ],
    });
    const integration = new BrandfetchLogoIntegration({ getBrandDetails } as never);

    const result = await integration.getDetails("acme.com");

    expect(getBrandDetails).toHaveBeenCalledWith({ identifier: "acme.com" });
    expect(result.id).toBe("acme.com");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.imageUrl).toBe("https://example.com/acme-dark.svg");
    expect(result.variants[0]?.insert.type).toBe("image");
  });

  it("maps BrandfetchNotFoundError to LogoNotFoundError", async () => {
    const integration = new BrandfetchLogoIntegration({
      getBrandDetails: vi.fn().mockRejectedValue(new BrandfetchNotFoundError("acme.com")),
    } as never);

    await expect(integration.getDetails("acme.com")).rejects.toBeInstanceOf(LogoNotFoundError);
  });

  it("maps BrandfetchRateLimitError to LogoRateLimitError", async () => {
    const integration = new BrandfetchLogoIntegration({
      searchBrands: vi.fn().mockRejectedValue(new BrandfetchRateLimitError()),
    } as never);

    await expect(integration.search("acme")).rejects.toBeInstanceOf(LogoRateLimitError);
  });

  it("propagates unexpected upstream errors", async () => {
    const integration = new BrandfetchLogoIntegration({
      getBrandDetails: vi.fn().mockRejectedValue(new Error("Brandfetch unavailable")),
    } as never);

    await expect(integration.getDetails("acme.com")).rejects.toThrow("Brandfetch unavailable");
  });
});
