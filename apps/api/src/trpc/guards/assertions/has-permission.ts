import { TRPCError } from "@trpc/server";
import {
  assertHasPermission,
  type HasPermissionApi,
  type Permissions,
} from "@deck-pack/auth/permissions";
import { auth } from "@deck-pack/auth/server";

const authApiWithPermission = auth.api as unknown as HasPermissionApi;

/** Asserts Better Auth org RBAC permissions for the given request headers. */
export async function hasPermission(headers: Headers, permissions: Permissions) {
  const result = await assertHasPermission(authApiWithPermission, headers, permissions);

  if (!result.ok) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to perform this operation",
    });
  }
}
