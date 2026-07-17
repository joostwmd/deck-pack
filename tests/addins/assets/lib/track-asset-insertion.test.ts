import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInsertionTracker } from "@/lib/track-asset-insertion";

describe("createInsertionTracker", () => {
  const track = vi.fn();

  beforeEach(() => {
    track.mockReset();
  });

  it("forwards canonical tracking fields", () => {
    const tracker = createInsertionTracker({ track });

    tracker.track({
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {
        variantId: "0",
        BRAND_NAME: "Acme",
      },
    });

    expect(track).toHaveBeenCalledWith({
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {
        variantId: "0",
        BRAND_NAME: "Acme",
      },
    });
  });
});
