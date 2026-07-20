import type { AuthClient } from "@deck-pack/auth/client";
import { isOrganizationRoleName, type Permissions } from "@deck-pack/auth/rbac";
import { redirect } from "@tanstack/react-router";

export async function requireOrgPermission(
  authClient: AuthClient,
  permissions: Permissions,
  redirectTo: "/org/dashboard" = "/org/dashboard",
): Promise<void> {
  const result = await authClient.organization.getActiveMemberRole();
  const role = result.data?.role;

  if (
    !role ||
    !isOrganizationRoleName(role) ||
    !authClient.organization.checkRolePermission({
      role,
      permissions,
    })
  ) {
    throw redirect({
      to: redirectTo,
    });
  }
}
