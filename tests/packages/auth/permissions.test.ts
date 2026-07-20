import { describe, expect, it, vi } from "vitest";

import {
  assertHasPermission,
  type HasPermissionApi,
} from "@deck-pack/auth/permissions";

function createMockAuthApi(success: boolean): HasPermissionApi {
  return {
    hasPermission: vi.fn().mockResolvedValue({ success }),
  };
}

describe("assertHasPermission", () => {
  it("returns ok when Better Auth grants permission", async () => {
    const authApi = createMockAuthApi(true);
    const headers = new Headers();

    await expect(
      assertHasPermission(authApi, headers, { member: ["create"] }),
    ).resolves.toEqual({ ok: true });

    expect(authApi.hasPermission).toHaveBeenCalledWith({
      headers,
      body: { permissions: { member: ["create"] } },
    });
  });

  it("returns not ok when Better Auth denies permission", async () => {
    const authApi = createMockAuthApi(false);

    await expect(
      assertHasPermission(authApi, new Headers(), { billing: ["manage"] }),
    ).resolves.toEqual({ ok: false });
  });
});
