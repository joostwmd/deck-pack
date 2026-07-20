import { createAccessControl } from "better-auth/plugins/access";

/** Better Auth organization plugin default resources/actions. */
export const ORG_DEFAULT_STATEMENTS = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const DECKPACK_STATEMENTS = {
  billing: ["view", "manage"],
  seat: ["view", "assign"],
  usage: ["view", "export"],
  asset: ["view", "insert"],
} as const;

const statement = {
  ...ORG_DEFAULT_STATEMENTS,
  ...DECKPACK_STATEMENTS,
} as const;

export const ac = createAccessControl(statement);

export const ORGANIZATION_ROLES = {
  owner: "organizationOwner",
  admin: "organizationAdmin",
  member: "organizationMember",
} as const;

export type OrganizationRoleName =
  (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES];

/** Permission map passed to Better Auth hasPermission / checkRolePermission. */
export type Permissions = Partial<{
  [K in keyof typeof statement]: Array<(typeof statement)[K][number]>;
}>;

export const organizationOwner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  billing: ["view", "manage"],
  seat: ["view", "assign"],
  usage: ["view", "export"],
  asset: ["view", "insert"],
});

export const organizationAdmin = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  billing: ["view"],
  seat: ["view", "assign"],
  usage: ["view"],
  asset: ["view", "insert"],
});

export const organizationMember = ac.newRole({
  usage: ["view"],
  asset: ["view", "insert"],
});

export const organizationRoles = {
  organizationOwner,
  organizationAdmin,
  organizationMember,
} as const;

const organizationRoleNames = Object.values(ORGANIZATION_ROLES);

export function isOrganizationRoleName(value: string): value is OrganizationRoleName {
  return (organizationRoleNames as readonly string[]).includes(value);
}

/** Synchronous role permission check (mirrors client checkRolePermission). */
export function checkOrganizationRolePermission(
  roleName: OrganizationRoleName,
  permissions: Permissions,
): boolean {
  switch (roleName) {
    case ORGANIZATION_ROLES.owner:
      return organizationOwner.authorize(permissions).success;
    case ORGANIZATION_ROLES.admin:
      return organizationAdmin.authorize(permissions).success;
    case ORGANIZATION_ROLES.member:
      return organizationMember.authorize(permissions).success;
  }
}
