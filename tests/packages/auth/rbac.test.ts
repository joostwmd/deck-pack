import { describe, expect, it } from "vitest";

import {
  ORGANIZATION_ROLES,
  checkOrganizationRolePermission,
} from "@deck-pack/auth/rbac";

describe("organization RBAC matrix", () => {
  it("grants owners full member and billing manage permissions", () => {
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.owner, { member: ["create"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.owner, { billing: ["manage"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.owner, { seat: ["assign"] }),
    ).toBe(true);
  });

  it("grants admins member management and billing view", () => {
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.admin, { member: ["create"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.admin, { billing: ["view"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.admin, { billing: ["manage"] }),
    ).toBe(false);
  });

  it("restricts members to asset insert and usage view", () => {
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.member, { asset: ["insert"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.member, { usage: ["view"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.member, { member: ["create"] }),
    ).toBe(false);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.member, { seat: ["assign"] }),
    ).toBe(false);
  });

  it("restricts add-in users to asset view and insert only", () => {
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { asset: ["insert"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { asset: ["view"] }),
    ).toBe(true);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { usage: ["view"] }),
    ).toBe(false);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { member: ["create"] }),
    ).toBe(false);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { seat: ["assign"] }),
    ).toBe(false);
    expect(
      checkOrganizationRolePermission(ORGANIZATION_ROLES.addinUser, { billing: ["view"] }),
    ).toBe(false);
  });
});
