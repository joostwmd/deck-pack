import { describe, expect, it } from "vitest";

import {
  CreateOrganizationSubscription,
  CreatePlan,
  GetOrganizationSubscription,
  GetPlan,
  ListOrganizationSubscriptions,
  ListPlans,
  UpdateOrganizationSubscription,
  UpdatePlan,
} from "@deck-pack/billing";
import {
  allUnlimitedLimits,
  InMemoryBillingRepository,
} from "@deck-pack/billing/repositories/in-memory-billing-repository";
import { ConflictError, InvalidStateError, NotFoundError } from "@deck-pack/errors";

function createRepo() {
  const repo = new InMemoryBillingRepository();
  const now = new Date();
  repo.seed({
    plans: [
      {
        id: "plan-1",
        name: "Pro",
        slug: "pro",
        limits: allUnlimitedLimits(),
        createdAt: now,
        updatedAt: now,
      },
    ],
    organizations: [
      { organizationId: "org-1", name: "Acme", slug: "acme" },
      { organizationId: "org-2", name: "Beta", slug: "beta" },
    ],
  });
  return repo;
}

describe("ListPlans / GetPlan / CreatePlan / UpdatePlan", () => {
  it("lists and gets plans", async () => {
    const repo = createRepo();
    const plans = await new ListPlans(repo).execute();
    expect(plans).toHaveLength(1);
    expect(await new GetPlan(repo).execute({ planId: "plan-1" })).toMatchObject({
      slug: "pro",
    });
  });

  it("throws NotFoundError for missing plan", async () => {
    const repo = createRepo();
    await expect(new GetPlan(repo).execute({ planId: "missing" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("creates a plan", async () => {
    const repo = createRepo();
    const plan = await new CreatePlan(repo).execute({
      name: "Starter",
      slug: "starter",
      limits: allUnlimitedLimits(),
    });
    expect(plan.slug).toBe("starter");
  });

  it("throws ConflictError on slug conflict", async () => {
    const repo = createRepo();
    await expect(
      new CreatePlan(repo).execute({
        name: "Other",
        slug: "pro",
        limits: allUnlimitedLimits(),
      }),
    ).rejects.toMatchObject({ message: "A plan with this slug already exists" });
    await expect(
      new CreatePlan(repo).execute({
        name: "Other",
        slug: "pro",
        limits: allUnlimitedLimits(),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws InvalidStateError on invalid limits", async () => {
    const repo = createRepo();
    await expect(
      new CreatePlan(repo).execute({
        name: "Bad",
        slug: "bad",
        limits: [],
      }),
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it("updates a plan", async () => {
    const repo = createRepo();
    const updated = await new UpdatePlan(repo).execute({
      planId: "plan-1",
      name: "Pro Plus",
      slug: "pro-plus",
      limits: allUnlimitedLimits(),
    });
    expect(updated).toMatchObject({ name: "Pro Plus", slug: "pro-plus" });
  });
});

describe("Subscriptions", () => {
  it("creates, lists, gets, and updates subscriptions", async () => {
    const repo = createRepo();
    const created = await new CreateOrganizationSubscription(repo).execute({
      organizationId: "org-1",
      planId: "plan-1",
      quantity: 3,
    });
    expect(created.status).toBe("active");

    const listed = await new ListOrganizationSubscriptions(repo).execute();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.organizationName).toBe("Acme");

    const got = await new GetOrganizationSubscription(repo).execute({
      subscriptionId: created.id,
    });
    expect(got.planSlug).toBe("pro");

    const updated = await new UpdateOrganizationSubscription(repo).execute({
      subscriptionId: created.id,
      quantity: 5,
    });
    expect(updated.quantity).toBe(5);
  });

  it("throws ConflictError when org already has active subscription", async () => {
    const repo = createRepo();
    await new CreateOrganizationSubscription(repo).execute({
      organizationId: "org-1",
      planId: "plan-1",
      quantity: 1,
    });
    await expect(
      new CreateOrganizationSubscription(repo).execute({
        organizationId: "org-1",
        planId: "plan-1",
        quantity: 2,
      }),
    ).rejects.toMatchObject({
      message: "This organization already has an active subscription",
    });
  });

  it("throws NotFoundError for missing organization/plan/subscription", async () => {
    const repo = createRepo();
    await expect(
      new CreateOrganizationSubscription(repo).execute({
        organizationId: "missing",
        planId: "plan-1",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      new CreateOrganizationSubscription(repo).execute({
        organizationId: "org-1",
        planId: "missing",
        quantity: 1,
      }),
    ).rejects.toMatchObject({ message: "Plan not found" });

    await expect(
      new GetOrganizationSubscription(repo).execute({ subscriptionId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
