import { beforeEach, describe, expect, it, vi } from "vitest";

const { insertImageWithMetadata, mutate } = vi.hoisted(() => ({
  insertImageWithMetadata: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@deck-pack/office-js", () => ({
  officeClient: {
    insertImageWithMetadata,
  },
}));

vi.mock("@/lib/url-to-base64", () => ({
  urlToBase64: vi.fn().mockResolvedValue("base64-image"),
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    addin: {
      insertions: {
        track: {
          mutate,
        },
      },
    },
  },
}));

import { insertDirectImage } from "./insert-asset";

describe("insertDirectImage", () => {
  beforeEach(() => {
    insertImageWithMetadata.mockReset();
    mutate.mockReset();
    insertImageWithMetadata.mockResolvedValue(undefined);
    mutate.mockResolvedValue({ id: "event-1" });
  });

  it("inserts a direct image in Office mode and tracks photo metadata", async () => {
    await insertDirectImage({
      imageUrl: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg",
      metadata: {
        PHOTOGRAPHER: "Joey Farina",
        INSERT_SOURCE: "large2x",
      },
      assetType: "photo",
      externalId: "2014422",
    });

    expect(insertImageWithMetadata).toHaveBeenCalledWith("base64-image", {
      PHOTOGRAPHER: "Joey Farina",
      INSERT_SOURCE: "large2x",
    });
    expect(mutate).toHaveBeenCalledWith({
      assetType: "photo",
      externalId: "2014422",
      client: "office",
      metadata: {
        PHOTOGRAPHER: "Joey Farina",
        INSERT_SOURCE: "large2x",
      },
    });
  });
});
