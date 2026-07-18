import { describe, expect, it, vi } from "vitest";

import { createIconService } from "@deck-pack/api/domains/icons/service";

describe("createIconService", () => {
  it("maps icon search responses", async () => {
    const searchIcons = vi.fn().mockResolvedValue({
      icons: [{ id: "icon-1", name: "Arrow", previewUrl: "https://example.com/arrow.png" }],
    });
    const service = createIconService({
      icons8: { searchIcons } as never,
    });

    const result = await service.search("arrow");

    expect(searchIcons).toHaveBeenCalledWith({ term: "arrow" });
    expect(result.results).toEqual([
      {
        id: "icon-1",
        name: "Arrow",
        imageUrl: "https://example.com/arrow.png",
      },
    ]);
  });

  it("maps icon details responses", async () => {
    const getIconById = vi.fn().mockResolvedValue({
      id: "icon-1",
      name: "Arrow",
      variants: [
        {
          platform: "ios7",
          previewUrl: "https://example.com/arrow-ios7.png",
          svg: "<svg />",
        },
      ],
    });
    const service = createIconService({
      icons8: { getIconById } as never,
    });

    const result = await service.getDetails("icon-1");

    expect(getIconById).toHaveBeenCalledWith({ id: "icon-1" });
    expect(result.id).toBe("icon-1");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.insert.type).toBe("svg");
  });

  it("propagates upstream icon errors", async () => {
    const service = createIconService({
      icons8: {
        searchIcons: vi.fn().mockRejectedValue(new Error("Icons8 unavailable")),
      } as never,
    });

    await expect(service.search("arrow")).rejects.toThrow("Icons8 unavailable");
  });
});
