import { describe, expect, it, vi } from "vitest";

import { createAddinService } from "@deck-pack/api/domains/addin/service";

describe("createAddinService", () => {
  const tx = {} as never;

  it("returns tracked insertion id on success", async () => {
    const service = createAddinService({
      insertAssetInsertion: vi.fn().mockResolvedValue({ id: "insertion-1" }),
      assertInsertAllowed: vi.fn().mockResolvedValue({ ok: true }),
    });

    const result = await service.trackInsertion(tx, {
      organizationId: "org-1",
      userId: "user-1",
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: { BRAND_NAME: "Acme" },
    });

    expect(result).toEqual({ ok: true, data: { id: "insertion-1" } });
  });

  it("maps quota exceeded to invalid_state", async () => {
    const service = createAddinService({
      insertAssetInsertion: vi.fn(),
      assertInsertAllowed: vi.fn().mockResolvedValue({
        ok: false,
        reason: "quota_exceeded",
        assetType: "logo",
      }),
    });

    const result = await service.trackInsertion(tx, {
      organizationId: "org-1",
      userId: "user-1",
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_state");
      expect(result.message).toMatch(/insert limit reached/i);
      expect(result.details).toEqual({ code: "quota_exceeded", assetType: "logo" });
    }
  });

  it("maps missing rows to internal failures", async () => {
    const service = createAddinService({
      insertAssetInsertion: vi.fn().mockResolvedValue(null),
      assertInsertAllowed: vi.fn().mockResolvedValue({ ok: true }),
    });

    const result = await service.trackInsertion(tx, {
      organizationId: "org-1",
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
