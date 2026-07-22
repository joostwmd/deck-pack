import { and, eq, gte, lt, sql } from "drizzle-orm";

import type { BillingRepository } from "@deck-pack/billing";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { user } from "@deck-pack/db/schema/auth";
import { organizationSeats } from "@deck-pack/db/schema/billing";
import { resolveEntitlementWindow } from "@deck-pack/db/usage-period";
import type { UnitOfWork } from "@deck-pack/db";

import type {
  ActiveSubscription,
  AssertInsertAllowedResult,
  AssetTypeCount,
  CountByAssetTypeInput,
  EntitlementWindow,
  InsertionSeriesPoint,
  ListSeatUsageInput,
  ListSeriesInput,
  PlanSummary,
  SeatUsageRow,
  UsagePeriodContext,
} from "../domain/usage";
import { PLAN_LIMIT_ASSET_TYPES } from "../domain/usage";

function asPlanLimitAssetType(value: string): (typeof PLAN_LIMIT_ASSET_TYPES)[number] | null {
  return (PLAN_LIMIT_ASSET_TYPES as readonly string[]).includes(value)
    ? (value as (typeof PLAN_LIMIT_ASSET_TYPES)[number])
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
  constructor(
    private readonly uow: UnitOfWork,
    private readonly billing: BillingRepository,
  ) {}

  private async countInsertions(input: {
    organizationId: string;
    assetType: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<number> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assetInsertions)
      .where(
        and(
          eq(assetInsertions.organizationId, input.organizationId),
          eq(assetInsertions.assetType, input.assetType),
          gte(assetInsertions.createdAt, input.periodStart),
          lt(assetInsertions.createdAt, input.periodEnd),
        ),
      );

    return row?.count ?? 0;
  }

  async getActiveSubscription(organizationId: string): Promise<ActiveSubscription | null> {
    const subscription =
      await this.billing.getActiveOrganizationSubscriptionByOrgId(organizationId);
    if (!subscription) return null;
    return {
      planId: subscription.planId,
      quantity: subscription.quantity,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async getPlan(planId: string): Promise<PlanSummary | null> {
    const plan = await this.billing.getPlan(planId);
    if (!plan) return null;

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      limits: plan.limits.flatMap((limit) => {
        const assetType = asPlanLimitAssetType(limit.assetType);
        if (!assetType) return [];
        return [{ assetType, insertsPerMonth: limit.insertsPerMonth }];
      }),
    };
  }

  async getEntitlementWindow(organizationId: string): Promise<EntitlementWindow> {
    const subscription = await this.getActiveSubscription(organizationId);
    return resolveEntitlementWindow({
      now: new Date(),
      billingPeriodStart: subscription?.currentPeriodStart ?? null,
      billingPeriodEnd: subscription?.currentPeriodEnd ?? null,
    });
  }

  async getUsagePeriodContext(organizationId: string): Promise<UsagePeriodContext> {
    const subscription = await this.getActiveSubscription(organizationId);
    return {
      now: new Date(),
      billingPeriodStart: subscription?.currentPeriodStart ?? null,
      billingPeriodEnd: subscription?.currentPeriodEnd ?? null,
    };
  }

  async countByAssetType(input: CountByAssetTypeInput): Promise<AssetTypeCount[]> {
    const db = this.uow.getDb();
    const rows = await db
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
    const db = this.uow.getDb();
    const conditions = [
      eq(assetInsertions.organizationId, input.organizationId),
      gte(assetInsertions.createdAt, input.periodStart),
      lt(assetInsertions.createdAt, input.periodEnd),
    ];

    if (input.userId) {
      conditions.push(eq(assetInsertions.userId, input.userId));
    }

    return db
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
    const db = this.uow.getDb();
    const seats = await db
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
        ? await db
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
    const { organizationId, assetType } = input;

    const subscription = await this.getActiveSubscription(organizationId);
    if (!subscription) {
      return { ok: false, reason: "no_subscription", assetType };
    }

    const plan = await this.getPlan(subscription.planId);
    if (!plan) {
      return { ok: false, reason: "no_subscription", assetType };
    }

    const limitRow = plan.limits.find((limit) => limit.assetType === assetType);
    const limit = limitRow?.insertsPerMonth ?? null;

    if (limit === null) {
      return { ok: true };
    }

    const window = await this.getEntitlementWindow(organizationId);
    const used = await this.countInsertions({
      organizationId,
      assetType,
      periodStart: window.start,
      periodEnd: window.end,
    });

    if (used >= limit) {
      return { ok: false, reason: "quota_exceeded", assetType };
    }

    return { ok: true };
  }

  async insertAssetInsertion(
    input: InsertAssetInsertionRepoInput,
  ): Promise<InsertAssetInsertionResult | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .insert(assetInsertions)
      .values({
        organizationId: input.organizationId,
        userId: input.userId,
        assetType: input.assetType,
        externalId: input.externalId,
        client: input.client,
        metadata: input.metadata ?? {},
      })
      .returning({ id: assetInsertions.id });

    return row ? { id: row.id } : null;
  }
}
