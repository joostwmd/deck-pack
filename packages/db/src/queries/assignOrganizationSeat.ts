import { and, eq, inArray, sql } from "drizzle-orm";

import { member } from "../schema/auth";
import { organizationSeats } from "../schema/billing";
import type { Transaction } from "../transaction";

import { countAssignedSeats } from "./countAssignedSeats";
import { getActiveOrganizationSubscriptionByOrgId } from "./getActiveOrganizationSubscriptionByOrgId";

export type AssignOrganizationSeatInput = {
  organizationId: string;
  email: string;
  assignedBy: string;
  userId?: string | null;
  status?: "pending" | "active";
};

export type AssignOrganizationSeatResult =
  | {
      ok: true;
      seatId: string;
      status: string;
      email: string;
      userId: string | null;
      assignedAt: Date;
      activatedAt: Date | null;
    }
  | {
      ok: false;
      reason:
        | "no_subscription"
        | "at_capacity"
        | "email_already_assigned"
        | "user_in_other_org";
    };

export async function assignOrganizationSeat({
  tx,
  input,
}: {
  tx: Transaction;
  input: AssignOrganizationSeatInput;
}): Promise<AssignOrganizationSeatResult> {
  const normalizedEmail = input.email.toLowerCase().trim();
  const subscription = await getActiveOrganizationSubscriptionByOrgId({
    tx,
    organizationId: input.organizationId,
  });

  if (!subscription) {
    return { ok: false, reason: "no_subscription" };
  }

  const assignedCount = await countAssignedSeats({ tx, organizationId: input.organizationId });
  if (assignedCount >= subscription.quantity) {
    return { ok: false, reason: "at_capacity" };
  }

  const [existingSeat] = await tx
    .select({ id: organizationSeats.id })
    .from(organizationSeats)
    .where(
      and(
        eq(organizationSeats.organizationId, input.organizationId),
        sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
        inArray(organizationSeats.status, ["pending", "active"]),
      ),
    )
    .limit(1);

  if (existingSeat) {
    return { ok: false, reason: "email_already_assigned" };
  }

  if (input.userId) {
    const [otherMembership] = await tx
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, input.userId))
      .limit(1);

    if (otherMembership && otherMembership.organizationId !== input.organizationId) {
      return { ok: false, reason: "user_in_other_org" };
    }
  }

  const status = input.status ?? (input.userId ? "active" : "pending");
  const now = new Date();

  const [row] = await tx
    .insert(organizationSeats)
    .values({
      organizationId: input.organizationId,
      email: normalizedEmail,
      userId: input.userId ?? null,
      status,
      assignedBy: input.assignedBy,
      assignedAt: now,
      activatedAt: status === "active" ? now : null,
    })
    .returning({
      seatId: organizationSeats.id,
      status: organizationSeats.status,
      email: organizationSeats.email,
      userId: organizationSeats.userId,
      assignedAt: organizationSeats.assignedAt,
      activatedAt: organizationSeats.activatedAt,
    });

  if (!row) {
    throw new Error("Failed to assign organization seat");
  }

  return { ok: true, ...row };
}
