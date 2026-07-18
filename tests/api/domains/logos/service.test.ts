import { describe, expect, it, vi } from "vitest";

import { createLogoService } from "@deck-pack/api/domains/logos/service";

describe("createLogoService", () => {
  it("maps logo search responses", async () => {
    const searchBrands = vi.fn().mockResolvedValue({
      results: [
        {
          id: "brand-1",
          brandId: "brand-1",
          name: "Acme",
          domain: "acme.com",
          logo: "https://example.com/acme.png",
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
        id: "brand-1",
        name: "Acme",
        imageUrl: "https://example.com/acme.png",
      },
    ]);
  });

  it("maps logo details responses", async () => {
    const getBrandDetails = vi.fn().mockResolvedValue({
      brandId: "brand-1",
      name: "Acme",
      logos: [
        {
          type: "logo",
          theme: "dark",
          formats: [{ src: "https://example.com/acme-dark.png" }],
        },
      ],
    });
    const service = createLogoService({
      brandfetch: { getBrandDetails } as never,
    });

    const result = await service.getDetails("brand-1");

    expect(getBrandDetails).toHaveBeenCalledWith({ brandId: "brand-1" });
    expect(result.id).toBe("brand-1");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.insert.type).toBe("image");
  });

  it("propagates upstream logo errors", async () => {
    const service = createLogoService({
      brandfetch: {
        getBrandDetails: vi.fn().mockRejectedValue(new Error("Brandfetch unavailable")),
      } as never,
    });

    await expect(service.getDetails("brand-1")).rejects.toThrow("Brandfetch unavailable");
  });
});
