import { and, eq, gte, lt, sql } from "drizzle-orm";

import { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import { getPlan } from "@deck-pack/db/queries/getPlan";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import {
  assertInsertAllowed,
  getEntitlementWindow,
  getUsagePeriodContext,
  type AssertInsertAllowedResult,
} from "@deck-pack/db/queries/usage-entitlements";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { user } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type {
  ActiveSubscription,
  AssetTypeCount,
  CountByAssetTypeInput,
  EntitlementWindow,
  InsertionSeriesPoint,
  ListSeatUsageInput,
  ListSeriesInput,
  PlanLimit,
  PlanLimitAssetType,
  PlanSummary,
  SeatUsageRow,
  UsagePeriodContext,
} from "../domain/usage";
import { PLAN_LIMIT_ASSET_TYPES } from "../domain/usage";

function asPlanLimitAssetType(value: string): PlanLimitAssetType | null {
  return (PLAN_LIMIT_ASSET_TYPES as readonly string[]).includes(value)
    ? (value as PlanLimitAssetType)
    : null;
}

export type InsertAssetInsertionRepoInput = {
  organizationId: string;
  userId: string;
  assetType: string;
  externalId: string;
  client: string;
  metadata?: Record<string, unknown>;
};

export type InsertAssetInsertionResult = {
  id: string;
};

export interface UsageRepository {
  getActiveSubscription(organizationId: string): Promise<ActiveSubscription | null>;
  getPlan(planId: string): Promise<PlanSummary | null>;
  getEntitlementWindow(organizationId: string): Promise<EntitlementWindow>;
  getUsagePeriodContext(organizationId: string): Promise<UsagePeriodContext>;
  countByAssetType(input: CountByAssetTypeInput): Promise<AssetTypeCount[]>;
  listSeries(input: ListSeriesInput): Promise<InsertionSeriesPoint[]>;
  listSeatUsage(input: ListSeatUsageInput): Promise<SeatUsageRow[]>;
  assertInsertAllowed(input: {
    organizationId: string;
    assetType: string;
  }): Promise<AssertInsertAllowedResult>;
  insertAssetInsertion(
    input: InsertAssetInsertionRepoInput,
  ): Promise<InsertAssetInsertionResult | null>;
}

export class DrizzleUsageRepository implements UsageRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async getActiveSubscription(organizationId: string): Promise<ActiveSubscription | null> {
    const subscription = await getActiveOrganizationSubscriptionByOrgId({
      tx: this.tx(),
      organizationId,
    });
    if (!subscription) return null;
    return {
      planId: subscription.planId,
      quantity: subscription.quantity,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async getPlan(planId: string): Promise<PlanSummary | null> {
    const plan = await getPlan({ tx: this.tx(), planId });
    if (!plan) return null;
    const limits: PlanLimit[] = plan.limits.flatMap((limit) => {
      const assetType = asPlanLimitAssetType(limit.assetType);
      if (!assetType) return [];
      return [{ assetType, insertsPerMonth: limit.insertsPerMonth }];
    });
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      limits,
    };
  }

  async getEntitlementWindow(organizationId: string): Promise<EntitlementWindow> {
    return getEntitlementWindow({ tx: this.tx(), organizationId });
  }

  async getUsagePeriodContext(organizationId: string): Promise<UsagePeriodContext> {
    const ctx = await getUsagePeriodContext({ tx: this.tx(), organizationId });
    return {
      now: ctx.now,
      billingPeriodStart: ctx.billingPeriodStart ?? null,
      billingPeriodEnd: ctx.billingPeriodEnd ?? null,
    };
  }

  async countByAssetType(input: CountByAssetTypeInput): Promise<AssetTypeCount[]> {
    const tx = this.tx();
    const rows = await tx
      .select({
        assetType: assetInsertions.assetType,
        count: sql<number>`count(*)::int`,
      })
      .from(assetInsertions)
      .where(
        and(
          eq(assetInsertions.organizationId, input.organizationId),
          gte(assetInsertions.createdAt, input.periodStart),
          lt(assetInsertions.createdAt, input.periodEnd),
          ...(input.userId ? [eq(assetInsertions.userId, input.userId)] : []),
        ),
      )
      .groupBy(assetInsertions.assetType);

    return rows.map((row) => ({
      assetType: row.assetType,
      count: row.count,
    }));
  }

  async listSeries(input: ListSeriesInput): Promise<InsertionSeriesPoint[]> {
    const tx = this.tx();
    const conditions = [
      eq(assetInsertions.organizationId, input.organizationId),
      gte(assetInsertions.createdAt, input.periodStart),
      lt(assetInsertions.createdAt, input.periodEnd),
    ];

    if (input.userId) {
      conditions.push(eq(assetInsertions.userId, input.userId));
    }

    return tx
      .select({
        date: sql<string>`to_char(date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`,
        assetType: assetInsertions.assetType,
        count: sql<number>`count(*)::int`,
      })
      .from(assetInsertions)
      .where(and(...conditions))
      .groupBy(
        sql`date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC')`,
        assetInsertions.assetType,
      )
      .orderBy(
        sql`date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC')`,
        assetInsertions.assetType,
      );
  }

  async listSeatUsage(input: ListSeatUsageInput): Promise<SeatUsageRow[]> {
    const tx = this.tx();
    const seats = await tx
      .select({
        seatId: organizationSeats.id,
        userId: organizationSeats.userId,
        email: organizationSeats.email,
        status: organizationSeats.status,
        name: user.name,
      })
      .from(organizationSeats)
      .leftJoin(user, eq(organizationSeats.userId, user.id))
      .where(
        and(
          eq(organizationSeats.organizationId, input.organizationId),
          sql`${organizationSeats.status} IN ('pending', 'active')`,
        ),
      );

    const results: SeatUsageRow[] = [];

    for (const seat of seats) {
      const byAssetType = seat.userId
        ? await tx
            .select({
              assetType: assetInsertions.assetType,
              count: sql<number>`count(*)::int`,
            })
            .from(assetInsertions)
            .where(
              and(
                eq(assetInsertions.organizationId, input.organizationId),
                eq(assetInsertions.userId, seat.userId),
                gte(assetInsertions.createdAt, input.periodStart),
                lt(assetInsertions.createdAt, input.periodEnd),
              ),
            )
            .groupBy(assetInsertions.assetType)
        : [];

      const totalUsed = byAssetType.reduce((sum, row) => sum + row.count, 0);

      results.push({
        seatId: seat.seatId,
        userId: seat.userId,
        email: seat.email,
        name: seat.name,
        status: seat.status,
        totalUsed,
        byAssetType: byAssetType.map((row) => ({
          assetType: row.assetType,
          count: row.count,
        })),
      });
    }

    return results;
  }

  async assertInsertAllowed(input: {
    organizationId: string;
    assetType: string;
  }): Promise<AssertInsertAllowedResult> {
    return assertInsertAllowed({
      tx: this.tx(),
      organizationId: input.organizationId,
      assetType: input.assetType,
    });
  }

  async insertAssetInsertion(
    input: InsertAssetInsertionRepoInput,
  ): Promise<InsertAssetInsertionResult | null> {
    const row = await insertAssetInsertion({ tx: this.tx(), input });
    return row ? { id: row.id } : null;
  }
}
