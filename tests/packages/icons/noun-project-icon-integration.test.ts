import {
  NounProjectNotFoundError,
  NounProjectRateLimitError,
} from "@deck-pack/integrations/noun-project";
import {
  IconNotFoundError,
  IconRateLimitError,
  NounProjectIconIntegration,
  mapIconDetailsResponse,
  mapIconSearchResponse,
} from "@deck-pack/icons";
import { describe, expect, it, vi } from "vitest";

describe("NounProjectIconIntegration", () => {
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
    const integration = new NounProjectIconIntegration({ searchIcons } as never);

    const result = await integration.search("arrow");

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
    const integration = new NounProjectIconIntegration({ getIconDetails } as never);

    const result = await integration.getDetails("1234");

    expect(getIconDetails).toHaveBeenCalledWith({ id: "1234" });
    expect(result.id).toBe("1234");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.insert.type).toBe("svg");
    expect(result.metadata.PROVIDER).toBe("noun-project");
  });

  it("maps NounProjectNotFoundError to IconNotFoundError", async () => {
    const integration = new NounProjectIconIntegration({
      getIconDetails: vi.fn().mockRejectedValue(new NounProjectNotFoundError("1234")),
    } as never);

    await expect(integration.getDetails("1234")).rejects.toBeInstanceOf(IconNotFoundError);
  });

  it("maps NounProjectRateLimitError to IconRateLimitError", async () => {
    const integration = new NounProjectIconIntegration({
      searchIcons: vi.fn().mockRejectedValue(new NounProjectRateLimitError()),
    } as never);

    await expect(integration.search("arrow")).rejects.toBeInstanceOf(IconRateLimitError);
  });

  it("propagates unexpected upstream errors", async () => {
    const integration = new NounProjectIconIntegration({
      searchIcons: vi.fn().mockRejectedValue(new Error("Noun Project unavailable")),
    } as never);

    await expect(integration.search("arrow")).rejects.toThrow("Noun Project unavailable");
  });
});

describe("icon mappers", () => {
  it("maps icon search responses", () => {
    const mapped = mapIconSearchResponse({
      icons: [
        {
          id: "icon-1",
          term: "Arrow",
          thumbnail_url: "https://example.com/arrow.png",
        },
      ],
    } as never);

    expect(mapped.results).toEqual([
      {
        id: "icon-1",
        name: "Arrow",
        imageUrl: "https://example.com/arrow.png",
      },
    ]);
  });

  it("maps icon details responses with svg variants", () => {
    const mapped = mapIconDetailsResponse({
      id: "icon-1",
      name: "Arrow",
      attribution: "Icon by Noun Project",
      thumbnailUrl: "https://example.com/arrow.png",
      variants: [
        {
          id: "ios7",
          name: "ios7",
          previewUrl: "https://example.com/arrow-ios7.png",
          svg: "<svg />",
        },
      ],
    });

    expect(mapped.id).toBe("icon-1");
    expect(mapped.variants[0]).toEqual({
      id: "ios7",
      imageUrl: "https://example.com/arrow-ios7.png",
      name: "Ios7",
      insert: {
        type: "svg",
        svg: "<svg />",
      },
    });
    expect(mapped.metadata).toEqual({
      TYPE: "icon",
      ICON_ID: "icon-1",
      ICON_NAME: "Arrow",
      ATTRIBUTION: "Icon by Noun Project",
      PROVIDER: "noun-project",
    });
  });
});
