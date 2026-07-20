import { and, eq, ne } from "drizzle-orm";

import {
  PLAN_LIMIT_ASSET_TYPES,
  planLimits,
  plans,
  type PlanLimitAssetType,
} from "../schema/billing";
import { withTransaction, type Transaction } from "../transaction";

export type UpdatePlanLimitInput = {
  assetType: PlanLimitAssetType;
  insertsPerMonth: number | null;
};

export type UpdatePlanInput = {
  planId: string;
  name: string;
  slug: string;
  limits: UpdatePlanLimitInput[];
};

export type UpdatePlanResult =
  | {
      ok: true;
      id: string;
      name: string;
      slug: string;
      limits: UpdatePlanLimitInput[];
      createdAt: Date;
      updatedAt: Date;
    }
  | { ok: false; reason: "not_found" | "slug_conflict" | "invalid_limits" };

function normalizeLimits(limits: UpdatePlanLimitInput[]): UpdatePlanLimitInput[] | null {
  if (limits.length !== PLAN_LIMIT_ASSET_TYPES.length) {
    return null;
  }

  const byType = new Map(limits.map((limit) => [limit.assetType, limit.insertsPerMonth]));
  const normalized: UpdatePlanLimitInput[] = [];

  for (const assetType of PLAN_LIMIT_ASSET_TYPES) {
    if (!byType.has(assetType)) {
      return null;
    }
    const insertsPerMonth = byType.get(assetType) ?? null;
    if (
      insertsPerMonth !== null &&
      (!Number.isInteger(insertsPerMonth) || insertsPerMonth < 0)
    ) {
      return null;
    }
    normalized.push({ assetType, insertsPerMonth });
  }

  return normalized;
}

export async function updatePlan({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpdatePlanInput;
}): Promise<UpdatePlanResult> {
  const slug = input.slug.toLowerCase();
  const limits = normalizeLimits(input.limits);

  if (!limits) {
    return { ok: false, reason: "invalid_limits" };
  }

  return withTransaction(async () => {
    const [existing] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.id, input.planId))
      .limit(1);

    if (!existing) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const [slugConflict] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.slug, slug), ne(plans.id, input.planId)))
      .limit(1);

    if (slugConflict) {
      return { ok: false as const, reason: "slug_conflict" as const };
    }

    const [row] = await tx
      .update(plans)
      .set({
        name: input.name.trim(),
        slug,
      })
      .where(eq(plans.id, input.planId))
      .returning({
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      });

    if (!row) {
      return { ok: false as const, reason: "not_found" as const };
    }

    await tx.delete(planLimits).where(eq(planLimits.planId, input.planId));
    await tx.insert(planLimits).values(
      limits.map((limit) => ({
        planId: input.planId,
        assetType: limit.assetType,
        insertsPerMonth: limit.insertsPerMonth,
      })),
    );

    return {
      ok: true as const,
      id: row.id,
      name: row.name,
      slug: row.slug,
      limits,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}
