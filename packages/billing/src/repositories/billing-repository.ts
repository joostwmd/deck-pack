import { and, asc, eq, inArray, ne } from "drizzle-orm";

import { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import { getPlan } from "@deck-pack/db/queries/getPlan";
import {
  organizationSubscriptions,
  planLimits,
  plans,
  type PlanLimitAssetType as DbPlanLimitAssetType,
} from "@deck-pack/db/schema/billing";
import { organization } from "@deck-pack/db/schema/auth";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type {
  CreateOrganizationSubscriptionInput,
  CreateOrganizationSubscriptionResult,
  CreatePlanInput,
  CreatePlanResult,
  OrganizationSubscription,
  Plan,
  PlanLimit,
  PlanLimitAssetType,
  UpdateOrganizationSubscriptionInput,
  UpdateOrganizationSubscriptionResult,
  UpdatePlanInput,
  UpdatePlanResult,
} from "../domain/billing";
import { PLAN_LIMIT_ASSET_TYPES as DOMAIN_PLAN_LIMIT_ASSET_TYPES } from "../domain/billing";

function asPlanLimitAssetType(value: string): PlanLimitAssetType | null {
  return (DOMAIN_PLAN_LIMIT_ASSET_TYPES as readonly string[]).includes(value)
    ? (value as PlanLimitAssetType)
    : null;
}

function normalizeLimits(limits: PlanLimit[]): PlanLimit[] | null {
  if (limits.length !== DOMAIN_PLAN_LIMIT_ASSET_TYPES.length) {
    return null;
  }

  const byType = new Map(limits.map((limit) => [limit.assetType, limit.insertsPerMonth]));
  const normalized: PlanLimit[] = [];

  for (const assetType of DOMAIN_PLAN_LIMIT_ASSET_TYPES) {
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

export interface BillingRepository {
  listPlans(): Promise<Plan[]>;
  getPlan(planId: string): Promise<Plan | null>;
  createPlan(input: CreatePlanInput): Promise<CreatePlanResult>;
  updatePlan(input: UpdatePlanInput): Promise<UpdatePlanResult>;
  listOrganizationSubscriptions(): Promise<OrganizationSubscription[]>;
  getOrganizationSubscription(subscriptionId: string): Promise<OrganizationSubscription | null>;
  createOrganizationSubscription(
    input: CreateOrganizationSubscriptionInput,
  ): Promise<CreateOrganizationSubscriptionResult>;
  updateOrganizationSubscription(
    input: UpdateOrganizationSubscriptionInput,
  ): Promise<UpdateOrganizationSubscriptionResult>;
}

export class DrizzleBillingRepository implements BillingRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async listPlans(): Promise<Plan[]> {
    const tx = this.tx();
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

    const limitsByPlanId = new Map<string, PlanLimit[]>();

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

  async getPlan(planId: string): Promise<Plan | null> {
    return getPlan({ tx: this.tx(), planId });
  }

  async createPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
    const tx = this.tx();
    const slug = input.slug.toLowerCase();
    const limits = normalizeLimits(input.limits);

    if (!limits) {
      return { ok: false, reason: "invalid_limits" };
    }

    const [conflict] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, slug))
      .limit(1);

    if (conflict) {
      return { ok: false, reason: "slug_conflict" };
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
        assetType: limit.assetType as DbPlanLimitAssetType,
        insertsPerMonth: limit.insertsPerMonth,
      })),
    );

    return {
      ok: true,
      id: row.id,
      name: row.name,
      slug: row.slug,
      limits,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updatePlan(input: UpdatePlanInput): Promise<UpdatePlanResult> {
    const tx = this.tx();
    const slug = input.slug.toLowerCase();
    const limits = normalizeLimits(input.limits);

    if (!limits) {
      return { ok: false, reason: "invalid_limits" };
    }

    const [existing] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.id, input.planId))
      .limit(1);

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }

    const [slugConflict] = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.slug, slug), ne(plans.id, input.planId)))
      .limit(1);

    if (slugConflict) {
      return { ok: false, reason: "slug_conflict" };
    }

    const [row] = await tx
      .update(plans)
      .set({
        name: input.name.trim(),
        slug,
      })
      .where(eq(plans.id, input.planId))
      .returning({
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      });

    if (!row) {
      return { ok: false, reason: "not_found" };
    }

    await tx.delete(planLimits).where(eq(planLimits.planId, input.planId));
    await tx.insert(planLimits).values(
      limits.map((limit) => ({
        planId: input.planId,
        assetType: limit.assetType as DbPlanLimitAssetType,
        insertsPerMonth: limit.insertsPerMonth,
      })),
    );

    return {
      ok: true,
      id: row.id,
      name: row.name,
      slug: row.slug,
      limits,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listOrganizationSubscriptions(): Promise<OrganizationSubscription[]> {
    const tx = this.tx();
    return tx
      .select({
        id: organizationSubscriptions.id,
        organizationId: organizationSubscriptions.organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        planId: organizationSubscriptions.planId,
        planName: plans.name,
        planSlug: plans.slug,
        quantity: organizationSubscriptions.quantity,
        status: organizationSubscriptions.status,
        createdAt: organizationSubscriptions.createdAt,
        updatedAt: organizationSubscriptions.updatedAt,
      })
      .from(organizationSubscriptions)
      .innerJoin(organization, eq(organization.id, organizationSubscriptions.organizationId))
      .innerJoin(plans, eq(plans.id, organizationSubscriptions.planId))
      .orderBy(asc(organization.name));
  }

  async getOrganizationSubscription(
    subscriptionId: string,
  ): Promise<OrganizationSubscription | null> {
    const tx = this.tx();
    const [row] = await tx
      .select({
        id: organizationSubscriptions.id,
        organizationId: organizationSubscriptions.organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        planId: organizationSubscriptions.planId,
        planName: plans.name,
        planSlug: plans.slug,
        quantity: organizationSubscriptions.quantity,
        status: organizationSubscriptions.status,
        createdAt: organizationSubscriptions.createdAt,
        updatedAt: organizationSubscriptions.updatedAt,
      })
      .from(organizationSubscriptions)
      .innerJoin(organization, eq(organization.id, organizationSubscriptions.organizationId))
      .innerJoin(plans, eq(plans.id, organizationSubscriptions.planId))
      .where(eq(organizationSubscriptions.id, subscriptionId))
      .limit(1);

    return row ?? null;
  }

  async createOrganizationSubscription(
    input: CreateOrganizationSubscriptionInput,
  ): Promise<CreateOrganizationSubscriptionResult> {
    const result = await createOrganizationSubscription({ tx: this.tx(), input });
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      id: result.id,
      organizationId: result.organizationId,
      planId: result.planId,
      quantity: result.quantity,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async updateOrganizationSubscription(
    input: UpdateOrganizationSubscriptionInput,
  ): Promise<UpdateOrganizationSubscriptionResult> {
    const tx = this.tx();
    const [existing] = await tx
      .select({
        id: organizationSubscriptions.id,
        organizationId: organizationSubscriptions.organizationId,
        status: organizationSubscriptions.status,
      })
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.id, input.subscriptionId))
      .limit(1);

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }

    if (input.planId !== undefined) {
      const [plan] = await tx
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.id, input.planId))
        .limit(1);

      if (!plan) {
        return { ok: false, reason: "plan_not_found" };
      }
    }

    const nextStatus = input.status ?? existing.status;
    if (nextStatus === "active") {
      const [otherActive] = await tx
        .select({ id: organizationSubscriptions.id })
        .from(organizationSubscriptions)
        .where(
          and(
            eq(organizationSubscriptions.organizationId, existing.organizationId),
            eq(organizationSubscriptions.status, "active"),
            ne(organizationSubscriptions.id, input.subscriptionId),
          ),
        )
        .limit(1);

      if (otherActive) {
        return { ok: false, reason: "already_subscribed" };
      }
    }

    const [row] = await tx
      .update(organizationSubscriptions)
      .set({
        ...(input.planId !== undefined ? { planId: input.planId } : {}),
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .where(eq(organizationSubscriptions.id, input.subscriptionId))
      .returning({
        id: organizationSubscriptions.id,
        organizationId: organizationSubscriptions.organizationId,
        planId: organizationSubscriptions.planId,
        quantity: organizationSubscriptions.quantity,
        status: organizationSubscriptions.status,
        createdAt: organizationSubscriptions.createdAt,
        updatedAt: organizationSubscriptions.updatedAt,
      });

    if (!row) {
      return { ok: false, reason: "not_found" };
    }

    return { ok: true, ...row };
  }
}
