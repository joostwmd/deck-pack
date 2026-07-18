import { eq } from "drizzle-orm";

import {
  PLAN_LIMIT_ASSET_TYPES,
  planLimits,
  plans,
  type PlanLimitAssetType,
} from "../schema/billing";
import { withTransaction, type Transaction } from "../transaction";

export type PlanLimitInput = {
  assetType: PlanLimitAssetType;
  /** Null means unlimited. */
  insertsPerMonth: number | null;
};

export type CreatePlanInput = {
  name: string;
  slug: string;
  limits: PlanLimitInput[];
};

export type PlanRecord = {
  id: string;
  name: string;
  slug: string;
  limits: PlanLimitInput[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlanResult =
  | ({ ok: true } & PlanRecord)
  | { ok: false; reason: "slug_conflict" | "invalid_limits" };

function normalizeLimits(limits: PlanLimitInput[]): PlanLimitInput[] | null {
  if (limits.length !== PLAN_LIMIT_ASSET_TYPES.length) {
    return null;
  }

  const byType = new Map(limits.map((limit) => [limit.assetType, limit.insertsPerMonth]));
  const normalized: PlanLimitInput[] = [];

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

export async function createPlan({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreatePlanInput;
}): Promise<CreatePlanResult> {
  const slug = input.slug.toLowerCase();
  const limits = normalizeLimits(input.limits);

  if (!limits) {
    return { ok: false, reason: "invalid_limits" };
  }

  return withTransaction(async () => {
    const [conflict] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, slug))
      .limit(1);

    if (conflict) {
      return { ok: false as const, reason: "slug_conflict" as const };
    }

    const [row] = await tx
      .insert(plans)
      .values({
        name: input.name.trim(),
        slug,
      })
      .returning({
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      });

    if (!row) {
      throw new Error("Failed to create plan");
    }

    await tx.insert(planLimits).values(
      limits.map((limit) => ({
        planId: row.id,
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
