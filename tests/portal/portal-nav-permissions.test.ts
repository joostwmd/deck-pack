import { describe, expect, it } from "vitest";

import { ORG_NAV_ITEMS } from "../../apps/portal/src/config/portal-nav";
import { checkOrganizationRolePermission, ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

function canSeeNavItem(
  role: (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES],
  permissions?: {
    member?: ("create" | "update" | "delete")[];
    seat?: ("view" | "assign")[];
    billing?: ("view" | "manage")[];
  },
) {
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

  it("shows Seats for owner and admin", () => {
    const seatsItem = ORG_NAV_ITEMS.find((item) => item.to === "/org/seats");
    expect(seatsItem?.permissions).toEqual({ seat: ["view"] });

    expect(canSeeNavItem(ORGANIZATION_ROLES.owner, seatsItem?.permissions)).toBe(true);
    expect(canSeeNavItem(ORGANIZATION_ROLES.admin, seatsItem?.permissions)).toBe(true);
    expect(canSeeNavItem(ORGANIZATION_ROLES.member, seatsItem?.permissions)).toBe(false);
    expect(canSeeNavItem(ORGANIZATION_ROLES.addinUser, seatsItem?.permissions)).toBe(false);
  });

  it("shows Billing for owner only", () => {
    const billingItem = ORG_NAV_ITEMS.find((item) => item.to === "/org/billing");
    expect(billingItem?.permissions).toEqual({ billing: ["manage"] });

    expect(canSeeNavItem(ORGANIZATION_ROLES.owner, billingItem?.permissions)).toBe(true);
    expect(canSeeNavItem(ORGANIZATION_ROLES.admin, billingItem?.permissions)).toBe(false);
    expect(canSeeNavItem(ORGANIZATION_ROLES.member, billingItem?.permissions)).toBe(false);
  });
});
