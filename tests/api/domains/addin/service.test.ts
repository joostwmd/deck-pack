import { describe, expect, it, vi } from "vitest";

import { createAddinService } from "@deck-pack/api/domains/addin/service";

describe("createAddinService", () => {
  const tx = {} as never;

  it("returns tracked insertion id on success", async () => {
    const service = createAddinService({
      insertAssetInsertion: vi.fn().mockResolvedValue({ id: "insertion-1" }),
    });

    const result = await service.trackInsertion(tx, {
      userId: "user-1",
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: { BRAND_NAME: "Acme" },
    });

    expect(result).toEqual({ ok: true, data: { id: "insertion-1" } });
  });

  it("maps missing rows to internal failures", async () => {
    const service = createAddinService({
      insertAssetInsertion: vi.fn().mockResolvedValue(null),
    });

    const result = await service.trackInsertion(tx, {
      userId: "user-1",
      assetType: "icon",
      externalId: "icon-1",
      client: "web",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("internal");
    }
  });
});
