import { eq } from "drizzle-orm";

import {
  PLAN_LIMIT_ASSET_TYPES,
  planLimits,
  plans,
} from "../schema/billing";
import type { Transaction } from "../transaction";

export const FREE_PLAN_SLUG = "free" as const;

export type EnsureFreePlanResult =
  | { ok: true; planId: string; created: boolean }
  | { ok: false; reason: "create_failed" };

export async function ensureFreePlan({
  tx,
}: {
  tx: Transaction;
}): Promise<EnsureFreePlanResult> {
  const [existing] = await tx
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, FREE_PLAN_SLUG))
    .limit(1);

  if (existing) {
    return { ok: true, planId: existing.id, created: false };
  }

  const [row] = await tx
    .insert(plans)
    .values({
      name: "Free",
      slug: FREE_PLAN_SLUG,
    })
    .returning({ id: plans.id });

  if (!row) {
    return { ok: false, reason: "create_failed" };
  }

  await tx.insert(planLimits).values(
    PLAN_LIMIT_ASSET_TYPES.map((assetType) => ({
      planId: row.id,
      assetType,
      insertsPerMonth: null,
    })),
  );

  return { ok: true, planId: row.id, created: true };
}
