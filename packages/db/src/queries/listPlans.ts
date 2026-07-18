import { asc, inArray } from "drizzle-orm";

import {
  PLAN_LIMIT_ASSET_TYPES,
  planLimits,
  plans,
  type PlanLimitAssetType,
} from "../schema/billing";
import type { Transaction } from "../transaction";

function asPlanLimitAssetType(value: string): PlanLimitAssetType | null {
  return (PLAN_LIMIT_ASSET_TYPES as readonly string[]).includes(value)
    ? (value as PlanLimitAssetType)
    : null;
}

export async function listPlans({ tx }: { tx: Transaction }) {
  const planRows = await tx
    .select({
      id: plans.id,
      name: plans.name,
      slug: plans.slug,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .orderBy(asc(plans.name));

  if (planRows.length === 0) {
    return [];
  }

  const limitRows = await tx
    .select({
      planId: planLimits.planId,
      assetType: planLimits.assetType,
      insertsPerMonth: planLimits.insertsPerMonth,
    })
    .from(planLimits)
    .where(
      inArray(
        planLimits.planId,
        planRows.map((plan) => plan.id),
      ),
    )
    .orderBy(asc(planLimits.assetType));

  const limitsByPlanId = new Map<
    string,
    Array<{ assetType: PlanLimitAssetType; insertsPerMonth: number | null }>
  >();

  for (const limit of limitRows) {
    const assetType = asPlanLimitAssetType(limit.assetType);
    if (!assetType) {
      continue;
    }
    const existing = limitsByPlanId.get(limit.planId) ?? [];
    existing.push({
      assetType,
      insertsPerMonth: limit.insertsPerMonth,
    });
    limitsByPlanId.set(limit.planId, existing);
  }

  return planRows.map((plan) => ({
    ...plan,
    limits: limitsByPlanId.get(plan.id) ?? [],
  }));
}
