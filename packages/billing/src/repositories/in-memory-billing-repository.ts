import {
  PLAN_LIMIT_ASSET_TYPES,
  type PlanLimit,
  type CreateOrganizationSubscriptionInput,
  type CreateOrganizationSubscriptionResult,
  type CreatePlanInput,
  type CreatePlanResult,
  type OrganizationSubscription,
  type Plan,
  type UpdateOrganizationSubscriptionInput,
  type UpdateOrganizationSubscriptionResult,
  type UpdatePlanInput,
  type UpdatePlanResult,
} from "../domain/billing";
import type {
  ActiveOrganizationSubscriptionRow,
  BillingRepository,
  EnsureFreePlanResult,
} from "./billing-repository";
import { FREE_PLAN_SLUG } from "./billing-repository";

type SeedOrg = {
  organizationId: string;
  name: string;
  slug: string;
};

export type InMemoryBillingSeed = {
  plans?: Plan[];
  organizations?: SeedOrg[];
  subscriptions?: Array<{
    id: string;
    organizationId: string;
    planId: string;
    quantity: number;
    status: string;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
};

function normalizeLimits(limits: PlanLimit[]): PlanLimit[] | null {
  if (limits.length !== PLAN_LIMIT_ASSET_TYPES.length) {
    return null;
  }
  const byType = new Map(limits.map((limit) => [limit.assetType, limit.insertsPerMonth]));
  const normalized: PlanLimit[] = [];
  for (const assetType of PLAN_LIMIT_ASSET_TYPES) {
    if (!byType.has(assetType)) {
      return null;
    }
    const insertsPerMonth = byType.get(assetType) ?? null;
    if (insertsPerMonth !== null && (!Number.isInteger(insertsPerMonth) || insertsPerMonth < 0)) {
      return null;
    }
    normalized.push({ assetType, insertsPerMonth });
  }
  return normalized;
}

export function allUnlimitedLimits(): PlanLimit[] {
  return PLAN_LIMIT_ASSET_TYPES.map((assetType) => ({
    assetType,
    insertsPerMonth: null,
  }));
}

export class InMemoryBillingRepository implements BillingRepository {
  private plans: Plan[] = [];
  private organizations = new Map<string, SeedOrg>();
  private subscriptions: Array<{
    id: string;
    organizationId: string;
    planId: string;
    quantity: number;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  seed(data: InMemoryBillingSeed): void {
    this.plans.push(...(data.plans ?? []));
    for (const org of data.organizations ?? []) {
      this.organizations.set(org.organizationId, org);
    }
    for (const sub of data.subscriptions ?? []) {
      this.subscriptions.push({
        ...sub,
        currentPeriodStart: sub.currentPeriodStart ?? null,
        currentPeriodEnd: sub.currentPeriodEnd ?? null,
        createdAt: sub.createdAt ?? new Date(),
        updatedAt: sub.updatedAt ?? new Date(),
      });
    }
  }

  async listPlans(): Promise<Plan[]> {
    return [...this.plans].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getPlan(planId: string): Promise<Plan | null> {
    return this.plans.find((p) => p.id === planId) ?? null;
  }

  async ensureFreePlan(): Promise<EnsureFreePlanResult> {
    const existing = this.plans.find((p) => p.slug === FREE_PLAN_SLUG);
    if (existing) {
      return { ok: true, planId: existing.id, created: false };
    }
    const now = new Date();
    const plan: Plan = {
      id: crypto.randomUUID(),
      name: "Free",
      slug: FREE_PLAN_SLUG,
      limits: allUnlimitedLimits(),
      createdAt: now,
      updatedAt: now,
    };
    this.plans.push(plan);
    return { ok: true, planId: plan.id, created: true };
  }

  async createPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
    const slug = input.slug.toLowerCase();
    const limits = normalizeLimits(input.limits);
    if (!limits) {
      return { ok: false, reason: "invalid_limits" };
    }
    if (this.plans.some((p) => p.slug === slug)) {
      return { ok: false, reason: "slug_conflict" };
    }
    const now = new Date();
    const plan: Plan = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug,
      limits,
      createdAt: now,
      updatedAt: now,
    };
    this.plans.push(plan);
    return { ok: true, ...plan };
  }

  async updatePlan(input: UpdatePlanInput): Promise<UpdatePlanResult> {
    const slug = input.slug.toLowerCase();
    const limits = normalizeLimits(input.limits);
    if (!limits) {
      return { ok: false, reason: "invalid_limits" };
    }
    const plan = this.plans.find((p) => p.id === input.planId);
    if (!plan) {
      return { ok: false, reason: "not_found" };
    }
    if (this.plans.some((p) => p.slug === slug && p.id !== input.planId)) {
      return { ok: false, reason: "slug_conflict" };
    }
    plan.name = input.name.trim();
    plan.slug = slug;
    plan.limits = limits;
    plan.updatedAt = new Date();
    return { ok: true, ...plan };
  }

  async listOrganizationSubscriptions(): Promise<OrganizationSubscription[]> {
    return this.subscriptions
      .map((sub) => this.toJoined(sub))
      .filter((row): row is OrganizationSubscription => row !== null)
      .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  }

  async getOrganizationSubscription(
    subscriptionId: string,
  ): Promise<OrganizationSubscription | null> {
    const sub = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return null;
    return this.toJoined(sub);
  }

  async getActiveOrganizationSubscriptionByOrgId(
    organizationId: string,
  ): Promise<ActiveOrganizationSubscriptionRow | null> {
    const sub = this.subscriptions.find(
      (s) => s.organizationId === organizationId && s.status === "active",
    );
    if (!sub) return null;
    return {
      id: sub.id,
      organizationId: sub.organizationId,
      planId: sub.planId,
      quantity: sub.quantity,
      status: sub.status,
      provider: "manual",
      externalCustomerId: null,
      externalSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }

  async createOrganizationSubscription(
    input: CreateOrganizationSubscriptionInput,
  ): Promise<CreateOrganizationSubscriptionResult> {
    if (!this.organizations.has(input.organizationId)) {
      return { ok: false, reason: "organization_not_found" };
    }
    if (!this.plans.some((p) => p.id === input.planId)) {
      return { ok: false, reason: "plan_not_found" };
    }
    if (
      this.subscriptions.some(
        (s) => s.organizationId === input.organizationId && s.status === "active",
      )
    ) {
      return { ok: false, reason: "already_subscribed" };
    }
    const now = new Date();
    const row = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      planId: input.planId,
      quantity: input.quantity,
      status: "active",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.push(row);
    return { ok: true, ...row };
  }

  async updateOrganizationSubscription(
    input: UpdateOrganizationSubscriptionInput,
  ): Promise<UpdateOrganizationSubscriptionResult> {
    const existing = this.subscriptions.find((s) => s.id === input.subscriptionId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (input.planId !== undefined && !this.plans.some((p) => p.id === input.planId)) {
      return { ok: false, reason: "plan_not_found" };
    }
    const nextStatus = input.status ?? existing.status;
    if (nextStatus === "active") {
      const otherActive = this.subscriptions.some(
        (s) =>
          s.organizationId === existing.organizationId &&
          s.status === "active" &&
          s.id !== input.subscriptionId,
      );
      if (otherActive) {
        return { ok: false, reason: "already_subscribed" };
      }
    }
    if (input.planId !== undefined) existing.planId = input.planId;
    if (input.quantity !== undefined) existing.quantity = input.quantity;
    if (input.status !== undefined) existing.status = input.status;
    existing.updatedAt = new Date();
    return { ok: true, ...existing };
  }

  private toJoined(sub: {
    id: string;
    organizationId: string;
    planId: string;
    quantity: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): OrganizationSubscription | null {
    const org = this.organizations.get(sub.organizationId);
    const plan = this.plans.find((p) => p.id === sub.planId);
    if (!org || !plan) return null;
    return {
      id: sub.id,
      organizationId: sub.organizationId,
      organizationName: org.name,
      organizationSlug: org.slug,
      planId: sub.planId,
      planName: plan.name,
      planSlug: plan.slug,
      quantity: sub.quantity,
      status: sub.status,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}
