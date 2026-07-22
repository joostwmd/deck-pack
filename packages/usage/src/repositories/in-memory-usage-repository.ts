import type { BillingRepository } from "@deck-pack/billing";

import type {
  ActiveSubscription,
  AssertInsertAllowedResult,
  AssetTypeCount,
  CountByAssetTypeInput,
  EntitlementWindow,
  InsertionSeriesPoint,
  ListSeatUsageInput,
  ListSeriesInput,
  PlanLimit,
  PlanSummary,
  SeatUsageRow,
  UsagePeriodContext,
} from "../domain/usage";
import type {
  InsertAssetInsertionRepoInput,
  InsertAssetInsertionResult,
  UsageRepository,
} from "./usage-repository";

type SeedInsertion = {
  organizationId: string;
  userId: string;
  assetType: string;
  createdAt: Date;
};

type SeedSeat = {
  seatId: string;
  organizationId: string;
  userId: string | null;
  email: string;
  name: string | null;
  status: string;
};

export type InMemoryUsageSeed = {
  subscriptions?: Array<ActiveSubscription & { organizationId: string }>;
  plans?: PlanSummary[];
  insertions?: SeedInsertion[];
  seats?: SeedSeat[];
};

export class InMemoryUsageRepository implements UsageRepository {
  private subscriptions = new Map<string, ActiveSubscription>();
  private plans = new Map<string, PlanSummary>();
  private insertions: SeedInsertion[] = [];
  private seats: SeedSeat[] = [];

  constructor(private readonly billing: BillingRepository) {
    void this.billing;
  }

  seed(data: InMemoryUsageSeed): void {
    for (const sub of data.subscriptions ?? []) {
      const { organizationId, ...rest } = sub;
      this.subscriptions.set(organizationId, rest);
    }
    for (const plan of data.plans ?? []) {
      this.plans.set(plan.id, plan);
    }
    this.insertions.push(...(data.insertions ?? []));
    this.seats.push(...(data.seats ?? []));
  }

  async getActiveSubscription(organizationId: string): Promise<ActiveSubscription | null> {
    return this.subscriptions.get(organizationId) ?? null;
  }

  async getPlan(planId: string): Promise<PlanSummary | null> {
    return this.plans.get(planId) ?? null;
  }

  async getEntitlementWindow(organizationId: string): Promise<EntitlementWindow> {
    const sub = this.subscriptions.get(organizationId);
    if (sub?.currentPeriodStart && sub.currentPeriodEnd) {
      return {
        start: sub.currentPeriodStart,
        end: sub.currentPeriodEnd,
        label: "Billing period",
      };
    }
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start, end, label: "This month" };
  }

  async getUsagePeriodContext(organizationId: string): Promise<UsagePeriodContext> {
    const sub = this.subscriptions.get(organizationId);
    return {
      now: new Date(),
      billingPeriodStart: sub?.currentPeriodStart ?? null,
      billingPeriodEnd: sub?.currentPeriodEnd ?? null,
    };
  }

  async countByAssetType(input: CountByAssetTypeInput): Promise<AssetTypeCount[]> {
    const filtered = this.insertions.filter(
      (row) =>
        row.organizationId === input.organizationId &&
        row.createdAt >= input.periodStart &&
        row.createdAt < input.periodEnd &&
        (!input.userId || row.userId === input.userId),
    );
    const map = new Map<string, number>();
    for (const row of filtered) {
      map.set(row.assetType, (map.get(row.assetType) ?? 0) + 1);
    }
    return [...map.entries()].map(([assetType, count]) => ({ assetType, count }));
  }

  async listSeries(input: ListSeriesInput): Promise<InsertionSeriesPoint[]> {
    const filtered = this.insertions.filter(
      (row) =>
        row.organizationId === input.organizationId &&
        row.createdAt >= input.periodStart &&
        row.createdAt < input.periodEnd &&
        (!input.userId || row.userId === input.userId),
    );
    const map = new Map<string, number>();
    for (const row of filtered) {
      const date = row.createdAt.toISOString().slice(0, 10);
      const key = `${date}|${row.assetType}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([key, count]) => {
        const [date, assetType] = key.split("|");
        return { date: date!, assetType: assetType!, count };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.assetType.localeCompare(b.assetType));
  }

  async listSeatUsage(input: ListSeatUsageInput): Promise<SeatUsageRow[]> {
    return Promise.all(
      this.seats
        .filter(
          (seat) =>
            seat.organizationId === input.organizationId &&
            (seat.status === "pending" || seat.status === "active"),
        )
        .map(async (seat) => {
          const byAssetType = seat.userId
            ? await this.countByAssetType({
                organizationId: input.organizationId,
                userId: seat.userId,
                periodStart: input.periodStart,
                periodEnd: input.periodEnd,
              })
            : [];
          return {
            seatId: seat.seatId,
            userId: seat.userId,
            email: seat.email,
            name: seat.name,
            status: seat.status,
            totalUsed: byAssetType.reduce((sum, row) => sum + row.count, 0),
            byAssetType,
          };
        }),
    );
  }

  async assertInsertAllowed(input: {
    organizationId: string;
    assetType: string;
  }): Promise<AssertInsertAllowedResult> {
    const subscription = this.subscriptions.get(input.organizationId);
    if (!subscription) {
      return { ok: false, reason: "no_subscription", assetType: input.assetType };
    }

    const plan = this.plans.get(subscription.planId);
    if (!plan) {
      return { ok: false, reason: "no_subscription", assetType: input.assetType };
    }

    const limitRow = plan.limits.find((limit) => limit.assetType === input.assetType);
    const limit = limitRow?.insertsPerMonth ?? null;
    if (limit === null) {
      return { ok: true };
    }

    const window = await this.getEntitlementWindow(input.organizationId);
    const used = this.insertions.filter(
      (row) =>
        row.organizationId === input.organizationId &&
        row.assetType === input.assetType &&
        row.createdAt >= window.start &&
        row.createdAt < window.end,
    ).length;

    if (used >= limit) {
      return { ok: false, reason: "quota_exceeded", assetType: input.assetType };
    }

    return { ok: true };
  }

  async insertAssetInsertion(
    input: InsertAssetInsertionRepoInput,
  ): Promise<InsertAssetInsertionResult | null> {
    if (input.externalId === "__fail__") {
      return null;
    }
    this.insertions.push({
      organizationId: input.organizationId,
      userId: input.userId,
      assetType: input.assetType,
      createdAt: new Date(),
    });
    return { id: `insertion-${this.insertions.length}` };
  }
}

export function unlimitedPlanLimits(): PlanLimit[] {
  return ["logo", "flag", "icon", "harvey_ball", "photo", "slide", "shape"].map((assetType) => ({
    assetType: assetType as PlanLimit["assetType"],
    insertsPerMonth: null,
  }));
}
