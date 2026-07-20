import { and, eq, inArray, sql } from "drizzle-orm";

import { organizationSeats } from "../schema/billing";
import type { Transaction } from "../transaction";

export type ActivateOrganizationSeatResult =
  | {
      ok: true;
      seatId: string;
      organizationId: string;
      userId: string;
      email: string;
    }
  | { ok: false; reason: "not_found" | "already_active" | "revoked" };

export async function activateOrganizationSeat({
  tx,
  seatId,
  userId,
}: {
  tx: Transaction;
  seatId: string;
  userId: string;
}): Promise<ActivateOrganizationSeatResult> {
  const [seat] = await tx
    .select({
      id: organizationSeats.id,
      organizationId: organizationSeats.organizationId,
      email: organizationSeats.email,
      status: organizationSeats.status,
    })
    .from(organizationSeats)
    .where(eq(organizationSeats.id, seatId))
    .limit(1);

  if (!seat) {
    return { ok: false, reason: "not_found" };
  }

  if (seat.status === "revoked") {
    return { ok: false, reason: "revoked" };
  }

  if (seat.status === "active") {
    return { ok: false, reason: "already_active" };
  }

  const now = new Date();
  await tx
    .update(organizationSeats)
    .set({
      status: "active",
      userId,
      activatedAt: now,
      updatedAt: now,
    })
    .where(eq(organizationSeats.id, seatId));

  return {
    ok: true,
    seatId: seat.id,
    organizationId: seat.organizationId,
    userId,
    email: seat.email,
  };
}

export type FindPendingSeatByEmailResult = {
  seatId: string;
  organizationId: string;
  email: string;
  status: string;
} | null;

export async function findPendingSeatByEmail({
  tx,
  email,
}: {
  tx: Transaction;
  email: string;
}): Promise<FindPendingSeatByEmailResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const [row] = await tx
    .select({
      seatId: organizationSeats.id,
      organizationId: organizationSeats.organizationId,
      email: organizationSeats.email,
      status: organizationSeats.status,
    })
    .from(organizationSeats)
    .where(
      and(
        sql`lower(${organizationSeats.email}) = ${normalizedEmail}`,
        inArray(organizationSeats.status, ["pending", "active"]),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function hasActiveSeat({
  tx,
  organizationId,
  userId,
}: {
  tx: Transaction;
  organizationId: string;
  userId: string;
}): Promise<boolean> {
  const [row] = await tx
    .select({ id: organizationSeats.id })
    .from(organizationSeats)
    .where(
      and(
        eq(organizationSeats.organizationId, organizationId),
        eq(organizationSeats.userId, userId),
        eq(organizationSeats.status, "active"),
      ),
    )
    .limit(1);

  return Boolean(row);
}
