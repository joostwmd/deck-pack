import { asc, eq } from "drizzle-orm";

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

export async function getPlan({
  tx,
  planId,
}: {
  tx: Transaction;
  planId: string;
}) {
  const [plan] = await tx
    .select({
      id: plans.id,
      name: plans.name,
      slug: plans.slug,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!plan) {
    return null;
  }

  const limitRows = await tx
    .select({
      assetType: planLimits.assetType,
      insertsPerMonth: planLimits.insertsPerMonth,
    })
    .from(planLimits)
    .where(eq(planLimits.planId, planId))
    .orderBy(asc(planLimits.assetType));

  const limits = limitRows.flatMap((limit) => {
    const assetType = asPlanLimitAssetType(limit.assetType);
    if (!assetType) {
      return [];
    }
    return [{ assetType, insertsPerMonth: limit.insertsPerMonth }];
  });

  return { ...plan, limits };
}
