import type { Permissions } from "@deck-pack/auth/permissions";

import type { Context } from "../../context";
import { middleware } from "../../init";
import { hasPermission } from "../assertions/has-permission";

/** tRPC middleware — enforce org RBAC via Better Auth hasPermission. */
export function requirePermission(permissions: Permissions) {
  return middleware<Context>(async ({ ctx, next }) => {
    await hasPermission(ctx.headers, permissions);
    return next({ ctx });
  });
}
