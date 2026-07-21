import { describe, expect, it } from "vitest";

import {
  AssetInsertionFailedError,
  InsertQuotaExceededError,
  InMemoryUsageRepository,
  TrackAssetInsertion,
  UsageNoSubscriptionError,
} from "@deck-pack/usage";

function createRepoWithPlan(limit: number | null) {
  const repo = new InMemoryUsageRepository();
  repo.seed({
    subscriptions: [
      {
        organizationId: "org-1",
        planId: "plan-1",
        quantity: 1,
        currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
    plans: [
      {
        id: "plan-1",
        name: "Pro",
        slug: "pro",
        limits: [
          {
            assetType: "logo",
            insertsPerMonth: limit,
          },
        ],
      },
    ],
  });
  return repo;
}

describe("TrackAssetInsertion", () => {
  it("returns tracked insertion id on success", async () => {
    const repo = createRepoWithPlan(null);
    const result = await new TrackAssetInsertion(repo).execute({
      organizationId: "org-1",
      userId: "user-1",
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: { BRAND_NAME: "Acme" },
    });

    expect(result).toEqual({ id: "insertion-1" });
  });

  it("throws InsertQuotaExceededError when over quota", async () => {
    const repo = createRepoWithPlan(1);
    repo.seed({
      insertions: [
        {
          organizationId: "org-1",
          userId: "user-1",
          assetType: "logo",
          createdAt: new Date("2026-01-15T00:00:00.000Z"),
        },
      ],
    });

    await expect(
      new TrackAssetInsertion(repo).execute({
        organizationId: "org-1",
        userId: "user-1",
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {},
      }),
    ).rejects.toBeInstanceOf(InsertQuotaExceededError);
  });

  it("throws UsageNoSubscriptionError without a subscription", async () => {
    const repo = new InMemoryUsageRepository();

    await expect(
      new TrackAssetInsertion(repo).execute({
        organizationId: "org-missing",
        userId: "user-1",
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {},
      }),
    ).rejects.toBeInstanceOf(UsageNoSubscriptionError);
  });

  it("throws AssetInsertionFailedError when insert returns null", async () => {
    const repo = createRepoWithPlan(null);

    await expect(
      new TrackAssetInsertion(repo).execute({
        organizationId: "org-1",
        userId: "user-1",
        assetType: "icon",
        externalId: "__fail__",
        client: "web",
        metadata: {},
      }),
    ).rejects.toBeInstanceOf(AssetInsertionFailedError);
  });
});
