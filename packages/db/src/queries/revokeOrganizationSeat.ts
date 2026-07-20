import { and, eq } from "drizzle-orm";

import { organizationSeats } from "../schema/billing";
import type { Transaction } from "../transaction";

export type RevokeOrganizationSeatResult =
  | { ok: true; seatId: string }
  | { ok: false; reason: "not_found" | "already_revoked" };

export async function revokeOrganizationSeat({
  tx,
  seatId,
  organizationId,
}: {
  tx: Transaction;
  seatId: string;
  organizationId: string;
}): Promise<RevokeOrganizationSeatResult> {
  const [seat] = await tx
    .select({ id: organizationSeats.id, status: organizationSeats.status })
    .from(organizationSeats)
    .where(
      and(
        eq(organizationSeats.id, seatId),
        eq(organizationSeats.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!seat) {
    return { ok: false, reason: "not_found" };
  }

  if (seat.status === "revoked") {
    return { ok: false, reason: "already_revoked" };
  }

  const now = new Date();
  await tx
    .update(organizationSeats)
    .set({
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    })
    .where(eq(organizationSeats.id, seatId));

  return { ok: true, seatId };
}

export async function revokeSeatForUser({
  tx,
  organizationId,
  userId,
}: {
  tx: Transaction;
  organizationId: string;
  userId: string;
}): Promise<void> {
  const now = new Date();
  await tx
    .update(organizationSeats)
    .set({
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(organizationSeats.organizationId, organizationId),
        eq(organizationSeats.userId, userId),
        eq(organizationSeats.status, "active"),
      ),
    );
}
