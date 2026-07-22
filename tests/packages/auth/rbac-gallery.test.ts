import { describe, expect, it } from "vitest";

import { ORGANIZATION_ROLES, checkOrganizationRolePermission } from "@deck-pack/auth/rbac";

describe("organization RBAC gallery permissions", () => {
  it("grants gallery create to owner, admin, and library manager", () => {
    const permission = { gallery: ["create"] as const };

    expect(checkOrganizationRolePermission(ORGANIZATION_ROLES.owner, permission)).toBe(true);
    expect(checkOrganizationRolePermission(ORGANIZATION_ROLES.admin, permission)).toBe(true);
    expect(checkOrganizationRolePermission(ORGANIZATION_ROLES.libraryManager, permission)).toBe(
      true,
    );
  });

  it("denies gallery create to member and add-in user", () => {
    const permission = { gallery: ["create"] as const };

    expect(checkOrganizationRolePermission(ORGANIZATION_ROLES.member, permission)).toBe(false);
    expect(checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, permission)).toBe(false);
  });

  it("denies member create to library manager", () => {
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.libraryManager, {
        member: ["create"],
      }),
    ).toBe(false);
  });
});
