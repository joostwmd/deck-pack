import { and, asc, eq, inArray } from "drizzle-orm";

import { user } from "../schema/auth";
import { organizationSeats, type OrganizationSeatStatus } from "../schema/billing";
import type { Transaction } from "../transaction";

export type OrganizationSeatRow = {
  seatId: string;
  organizationId: string;
  email: string;
  userId: string | null;
  userName: string | null;
  status: OrganizationSeatStatus;
  assignedBy: string;
  assignedAt: Date;
  activatedAt: Date | null;
  revokedAt: Date | null;
};

export async function listOrganizationSeats({
  tx,
  organizationId,
  includeRevoked = false,
}: {
  tx: Transaction;
  organizationId: string;
  includeRevoked?: boolean;
}): Promise<OrganizationSeatRow[]> {
  const statuses = includeRevoked ? ["pending", "active", "revoked"] : ["pending", "active"];

  return tx
    .select({
      seatId: organizationSeats.id,
      organizationId: organizationSeats.organizationId,
      email: organizationSeats.email,
      userId: organizationSeats.userId,
      userName: user.name,
      status: organizationSeats.status,
      assignedBy: organizationSeats.assignedBy,
      assignedAt: organizationSeats.assignedAt,
      activatedAt: organizationSeats.activatedAt,
      revokedAt: organizationSeats.revokedAt,
    })
    .from(organizationSeats)
    .leftJoin(user, eq(organizationSeats.userId, user.id))
    .where(
      and(
        eq(organizationSeats.organizationId, organizationId),
        inArray(organizationSeats.status, statuses),
      ),
    )
    .orderBy(asc(organizationSeats.assignedAt))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        status: row.status as OrganizationSeatStatus,
      })),
    );
}
