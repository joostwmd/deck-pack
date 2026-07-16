import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutate } = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

import { createInsertionTracker } from "./track-asset-insertion";

const api = {
  addin: {
    insertions: {
      track: {
        mutate,
      },
    },
  },
} as never;

describe("createInsertionTracker", () => {
  beforeEach(() => {
    mutate.mockReset();
    mutate.mockResolvedValue({ id: "event-1" });
  });

  it("sends canonical tracking fields without awaiting the mutation", () => {
    const tracker = createInsertionTracker(api);

    tracker.track({
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
    const tracker = createInsertionTracker(api);

    expect(() =>
      tracker.track({
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
