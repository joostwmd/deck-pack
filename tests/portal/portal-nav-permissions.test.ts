import { describe, expect, it } from "vitest";

import { ORG_NAV_ITEMS } from "../../apps/portal/src/config/portal-nav";
import { checkOrganizationRolePermission, ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

function canSeeNavItem(role: (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES], permissions?: { member?: ("create" | "update" | "delete")[] }) {
  if (!permissions) {
    return true;
  }
  return checkOrganizationRolePermission(role, permissions);
}

describe("portal org nav permissions", () => {
  it("shows Members for owner and admin", () => {
    const membersItem = ORG_NAV_ITEMS.find((item) => item.to === "/org/members");
    expect(membersItem?.permissions).toEqual({ member: ["create"] });

    expect(canSeeNavItem(ORGANIZATION_ROLES.owner, membersItem?.permissions)).toBe(true);
    expect(canSeeNavItem(ORGANIZATION_ROLES.admin, membersItem?.permissions)).toBe(true);
  });

  it("hides Members for organization members", () => {
    const membersItem = ORG_NAV_ITEMS.find((item) => item.to === "/org/members");
    expect(canSeeNavItem(ORGANIZATION_ROLES.member, membersItem?.permissions)).toBe(false);
  });
});
