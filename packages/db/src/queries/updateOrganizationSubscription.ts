import { and, eq, ne } from "drizzle-orm";

import { organizationSubscriptions, plans } from "../schema/billing";
import type { Transaction } from "../transaction";

export type UpdateOrganizationSubscriptionInput = {
  subscriptionId: string;
  planId?: string;
  quantity?: number;
  status?: "active" | "canceled";
};

export type UpdateOrganizationSubscriptionResult =
  | {
      ok: true;
      id: string;
      organizationId: string;
      planId: string;
      quantity: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }
  | {
      ok: false;
      reason: "not_found" | "plan_not_found" | "already_subscribed";
    };

export async function updateOrganizationSubscription({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpdateOrganizationSubscriptionInput;
}): Promise<UpdateOrganizationSubscriptionResult> {
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
