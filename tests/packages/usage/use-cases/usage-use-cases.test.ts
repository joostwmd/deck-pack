import { describe, expect, it } from "vitest";

import {
  GetMemberUsage,
  GetUsageBySeat,
  GetUsageQuota,
  GetUsageSeries,
  InMemoryUsageRepository,
  unlimitedPlanLimits,
} from "@deck-pack/usage";
import { NotFoundError } from "@deck-pack/errors";
import { InMemoryBillingRepository } from "@deck-pack/billing/repositories/in-memory-billing-repository";

function createRepo() {
  const repo = new InMemoryUsageRepository(new InMemoryBillingRepository());
  const periodStart = new Date("2026-07-01T00:00:00.000Z");
  const periodEnd = new Date("2026-08-01T00:00:00.000Z");
  repo.seed({
    plans: [
      {
        id: "plan-1",
        name: "Pro",
        slug: "pro",
        limits: unlimitedPlanLimits().map((limit) =>
          limit.assetType === "logo" ? { ...limit, insertsPerMonth: 10 } : limit,
        ),
      },
    ],
    subscriptions: [
      {
        organizationId: "org-1",
        planId: "plan-1",
        quantity: 3,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    ],
    insertions: [
      {
        organizationId: "org-1",
        userId: "user-1",
        assetType: "logo",
        createdAt: new Date("2026-07-05T12:00:00.000Z"),
      },
      {
        organizationId: "org-1",
        userId: "user-1",
        assetType: "logo",
        createdAt: new Date("2026-07-06T12:00:00.000Z"),
      },
      {
        organizationId: "org-1",
        userId: "user-2",
        assetType: "icon",
        createdAt: new Date("2026-07-07T12:00:00.000Z"),
      },
    ],
    seats: [
      {
        seatId: "seat-1",
        organizationId: "org-1",
        userId: "user-1",
        email: "a@x.com",
        name: "Alice",
        status: "active",
      },
      {
        seatId: "seat-2",
        organizationId: "org-1",
        userId: null,
        email: "pending@x.com",
        name: null,
        status: "pending",
      },
    ],
  });
  return repo;
}

describe("GetUsageQuota", () => {
  it("returns quota items with used/limit/remaining", async () => {
    const repo = createRepo();
    const quota = await new GetUsageQuota(repo).execute({ organizationId: "org-1" });
    expect(quota.periodLabel).toBe("Billing period");
    const logo = quota.items.find((item) => item.assetType === "logo");
    expect(logo).toMatchObject({ used: 2, limit: 10, remaining: 8 });
  });

  it("throws NotFoundError when no subscription", async () => {
    const repo = new InMemoryUsageRepository(new InMemoryBillingRepository());
    await expect(
      new GetUsageQuota(repo).execute({ organizationId: "missing" }),
    ).rejects.toMatchObject({ message: "No active subscription" });
    await expect(
      new GetUsageQuota(repo).execute({ organizationId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when plan missing", async () => {
    const repo = new InMemoryUsageRepository(new InMemoryBillingRepository());
    repo.seed({
      subscriptions: [
        {
          organizationId: "org-1",
          planId: "missing-plan",
          quantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      ],
    });
    await expect(
      new GetUsageQuota(repo).execute({ organizationId: "org-1" }),
    ).rejects.toMatchObject({ message: "Plan not found" });
  });
});

describe("GetUsageSeries / GetUsageBySeat / GetMemberUsage", () => {
  it("returns series points", async () => {
    const repo = createRepo();
    const series = await new GetUsageSeries(repo).execute({
      organizationId: "org-1",
      period: { preset: "billing_period" },
    });
    expect(series.points.length).toBeGreaterThan(0);
    expect(series.points.some((p) => p.assetType === "logo")).toBe(true);
  });

  it("returns seat usage rows", async () => {
    const repo = createRepo();
    const bySeat = await new GetUsageBySeat(repo).execute({
      organizationId: "org-1",
      period: { preset: "billing_period" },
    });
    expect(bySeat.seats).toHaveLength(2);
    const alice = bySeat.seats.find((s) => s.seatId === "seat-1");
    expect(alice?.totalUsed).toBe(2);
  });

  it("returns member usage", async () => {
    const repo = createRepo();
    const member = await new GetMemberUsage(repo).execute({
      organizationId: "org-1",
      userId: "user-1",
      period: { preset: "billing_period" },
    });
    expect(member.totalUsed).toBe(2);
    expect(member.userId).toBe("user-1");
  });
});
