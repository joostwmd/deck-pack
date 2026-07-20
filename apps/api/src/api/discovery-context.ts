import type { Context } from "../context";

export function discoveryOrganizationId(ctx: Context): string | null {
  return ctx.session?.session?.activeOrganizationId ?? null;
}
