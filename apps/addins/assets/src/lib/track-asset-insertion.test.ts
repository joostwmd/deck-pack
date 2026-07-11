import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutate } = vi.hoisted(() => ({
  mutate: vi.fn(),
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

import { trackAssetInsertion } from "./track-asset-insertion";

describe("trackAssetInsertion", () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it("sends canonical tracking fields without awaiting the mutation", () => {
    mutate.mockResolvedValue({ id: "event-1" });

    trackAssetInsertion({
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {
        variantId: "0",
        BRAND_NAME: "Acme",
      },
    });

    expect(mutate).toHaveBeenCalledWith({
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {
        variantId: "0",
        BRAND_NAME: "Acme",
      },
    });
  });

  it("swallows tracking failures without throwing", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mutate.mockRejectedValue(new Error("tracking failed"));

    expect(() =>
      trackAssetInsertion({
        assetType: "flag",
        externalId: "flag-nl",
        client: "web",
        metadata: { variantId: "rectangle" },
      }),
    ).not.toThrow();

    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to track asset insertion:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
