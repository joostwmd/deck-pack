import { describe, expect, it, vi } from "vitest";

import { createOrganizationService } from "@deck-pack/api/domains/organization/service";

describe("createOrganizationService", () => {
  const tx = {} as never;

  it("lookupUser returns not found", async () => {
    const service = createOrganizationService({
      findUserByEmail: vi.fn().mockResolvedValue(null),
      listOrganizationsWithOwner: vi.fn(),
      createOrganizationWithOwner: vi.fn(),
    });

    const result = await service.lookupUser(tx, { email: "a@b.com" });
    expect(result).toEqual({ ok: true, data: { found: false } });
  });

  it("createOrganization maps slug conflict", async () => {
    const service = createOrganizationService({
      findUserByEmail: vi.fn(),
      listOrganizationsWithOwner: vi.fn(),
      createOrganizationWithOwner: vi.fn().mockResolvedValue({
        ok: false,
        reason: "slug_conflict",
      }),
    });

    const result = await service.createOrganization(tx, {
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@acme.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("conflict");
    }
  });
});
