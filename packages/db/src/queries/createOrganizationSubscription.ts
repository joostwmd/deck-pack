import { and, eq } from "drizzle-orm";

import { calendarMonthEntitlementWindow } from "../usage-period";
import { organization } from "../schema/auth";
import { organizationSubscriptions, plans } from "../schema/billing";
import type { Transaction } from "../transaction";

export type CreateOrganizationSubscriptionInput = {
  organizationId: string;
  planId: string;
  quantity: number;
};

export type CreateOrganizationSubscriptionResult =
  | {
      ok: true;
      id: string;
      organizationId: string;
      planId: string;
      quantity: number;
      status: string;
      provider: string;
      externalCustomerId: string | null;
      externalSubscriptionId: string | null;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }
  | {
      ok: false;
      reason: "organization_not_found" | "plan_not_found" | "already_subscribed";
    };

export async function createOrganizationSubscription({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateOrganizationSubscriptionInput;
}): Promise<CreateOrganizationSubscriptionResult> {
  const [org] = await tx
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, input.organizationId))
    .limit(1);

  if (!org) {
    return { ok: false, reason: "organization_not_found" };
  }

  const [plan] = await tx
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.id, input.planId))
    .limit(1);

  if (!plan) {
    return { ok: false, reason: "plan_not_found" };
  }

  const [existing] = await tx
    .select({ id: organizationSubscriptions.id })
    .from(organizationSubscriptions)
    .where(
      and(
        eq(organizationSubscriptions.organizationId, input.organizationId),
        eq(organizationSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (existing) {
    return { ok: false, reason: "already_subscribed" };
  }

  const period = calendarMonthEntitlementWindow(new Date());

  const [row] = await tx
    .insert(organizationSubscriptions)
    .values({
      organizationId: input.organizationId,
      planId: input.planId,
      quantity: input.quantity,
      status: "active",
      provider: "manual",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    })
    .returning({
      id: organizationSubscriptions.id,
      organizationId: organizationSubscriptions.organizationId,
      planId: organizationSubscriptions.planId,
      quantity: organizationSubscriptions.quantity,
      status: organizationSubscriptions.status,
      provider: organizationSubscriptions.provider,
      externalCustomerId: organizationSubscriptions.externalCustomerId,
      externalSubscriptionId: organizationSubscriptions.externalSubscriptionId,
      currentPeriodStart: organizationSubscriptions.currentPeriodStart,
      currentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
      createdAt: organizationSubscriptions.createdAt,
      updatedAt: organizationSubscriptions.updatedAt,
    });

  if (!row) {
    throw new Error("Failed to create organization subscription");
  }

  return { ok: true, ...row };
}
