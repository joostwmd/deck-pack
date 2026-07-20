import { describe, expect, it, vi } from "vitest";

import { createLogoService } from "@deck-pack/api/domains/logos/service";

describe("createLogoService", () => {
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
    const service = createLogoService({
      brandfetch: { searchBrands } as never,
    });

    const result = await service.search("acme");

    expect(searchBrands).toHaveBeenCalledWith({ query: "acme" });
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
    const service = createLogoService({
      brandfetch: { getBrandDetails } as never,
    });

    const result = await service.getDetails("acme.com");

    expect(getBrandDetails).toHaveBeenCalledWith({ identifier: "acme.com" });
    expect(result.id).toBe("acme.com");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.imageUrl).toBe("https://example.com/acme-dark.svg");
    expect(result.variants[0]?.insert.type).toBe("image");
  });

  it("propagates upstream logo errors", async () => {
    const service = createLogoService({
      brandfetch: {
        getBrandDetails: vi.fn().mockRejectedValue(new Error("Brandfetch unavailable")),
      } as never,
    });

    await expect(service.getDetails("acme.com")).rejects.toThrow("Brandfetch unavailable");
  });
});
