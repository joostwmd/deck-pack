import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@deck-pack/db", () => ({
  tx: {},
}));

vi.mock("@deck-pack/auth/server", () => ({
  auth: {
    api: {},
  },
}));

vi.mock("@deck-pack/auth/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@deck-pack/auth/permissions")>();
  return {
    ...actual,
    assertHasPermission: vi.fn(),
  };
});

import { assertHasPermission } from "@deck-pack/auth/permissions";
import { hasPermission } from "@deck-pack/api/trpc/guards/assertions/has-permission";

describe("hasPermission", () => {
  beforeEach(() => {
    vi.mocked(assertHasPermission).mockReset();
  });

  it("throws FORBIDDEN when Better Auth denies permission", async () => {
    vi.mocked(assertHasPermission).mockResolvedValue({ ok: false });

    await expect(hasPermission(new Headers(), { member: ["create"] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("resolves when Better Auth grants permission", async () => {
    vi.mocked(assertHasPermission).mockResolvedValue({ ok: true });

    await expect(hasPermission(new Headers(), { billing: ["view"] })).resolves.toBeUndefined();
  });
});

describe("requirePermission middleware contract", () => {
  it("maps denied permissions to TRPCError FORBIDDEN", async () => {
    vi.mocked(assertHasPermission).mockResolvedValue({ ok: false });

    await expect(hasPermission(new Headers(), { seat: ["assign"] })).rejects.toBeInstanceOf(
      TRPCError,
    );
  });
});
