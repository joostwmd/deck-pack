import { describe, expect, it } from "vitest";

import {
  mapIconDetailsResponse,
  mapIconSearchResponse,
} from "@deck-pack/api/domains/icons/mappers";

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
    });

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
