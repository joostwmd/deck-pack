import { describe, expect, it, vi } from "vitest";

import { createIconService } from "@deck-pack/api/domains/icons/service";

describe("createIconService", () => {
  it("maps icon search responses", async () => {
    const searchIcons = vi.fn().mockResolvedValue({
      icons: [
        {
          id: "1234",
          term: "Arrow",
          thumbnail_url: "https://example.com/arrow.png",
        },
      ],
    });
    const service = createIconService({
      nounProject: { searchIcons } as never,
    });

    const result = await service.search("arrow");

    expect(searchIcons).toHaveBeenCalledWith({ query: "arrow" });
    expect(result.results).toEqual([
      {
        id: "1234",
        name: "Arrow",
        imageUrl: "https://example.com/arrow.png",
      },
    ]);
  });

  it("maps icon details responses", async () => {
    const getIconDetails = vi.fn().mockResolvedValue({
      id: "1234",
      name: "Arrow",
      attribution: "Arrow by Artist from Noun Project",
      thumbnailUrl: "https://example.com/arrow.png",
      variants: [
        {
          id: "1234",
          name: "Line",
          previewUrl: "https://example.com/arrow.png",
          svg: "<svg />",
        },
      ],
    });
    const service = createIconService({
      nounProject: { getIconDetails } as never,
    });

    const result = await service.getDetails("1234");

    expect(getIconDetails).toHaveBeenCalledWith({ id: "1234" });
    expect(result.id).toBe("1234");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.insert.type).toBe("svg");
    expect(result.metadata.PROVIDER).toBe("noun-project");
  });

  it("propagates upstream icon errors", async () => {
    const service = createIconService({
      nounProject: {
        searchIcons: vi.fn().mockRejectedValue(new Error("Noun Project unavailable")),
      } as never,
    });

    await expect(service.search("arrow")).rejects.toThrow("Noun Project unavailable");
  });
});
