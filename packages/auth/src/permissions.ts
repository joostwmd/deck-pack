import type { Permissions } from "./utils/rbac";

export type { Permissions };

/** Better Auth organization plugin adds hasPermission at runtime. */
export type HasPermissionApi = {
  hasPermission: (args: {
    headers: Headers;
    body: { permissions: Permissions };
  }) => Promise<{ success: boolean }>;
};

export type AssertHasPermissionResult = { ok: true } | { ok: false };

export async function assertHasPermission(
  authApi: HasPermissionApi,
  headers: Headers,
  permissions: Permissions,
): Promise<AssertHasPermissionResult> {
  const result = await authApi.hasPermission({
    headers,
    body: { permissions },
  });

  return result.success ? { ok: true } : { ok: false };
}
