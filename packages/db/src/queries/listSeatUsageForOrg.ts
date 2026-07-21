import { and, eq, gte, lt, sql } from "drizzle-orm";

import { user } from "../schema/auth";
import { organizationSeats } from "../schema/billing";
import { assetInsertions } from "../schema/asset-insertions";
import type { Transaction } from "../transaction";

export type ListSeatUsageForOrgInput = {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
};

export type SeatUsageRow = {
  seatId: string;
  userId: string | null;
  email: string;
  name: string | null;
  status: string;
  totalUsed: number;
  byAssetType: Array<{ assetType: string; count: number }>;
};

export async function listSeatUsageForOrg({
  tx,
  input,
}: {
  tx: Transaction;
  input: ListSeatUsageForOrgInput;
}): Promise<SeatUsageRow[]> {
  const seats = await tx
    .select({
      seatId: organizationSeats.id,
      userId: organizationSeats.userId,
      email: organizationSeats.email,
      status: organizationSeats.status,
      name: user.name,
    })
    .from(organizationSeats)
    .leftJoin(user, eq(organizationSeats.userId, user.id))
    .where(
      and(
        eq(organizationSeats.organizationId, input.organizationId),
        sql`${organizationSeats.status} IN ('pending', 'active')`,
      ),
    );

  const results: SeatUsageRow[] = [];

  for (const seat of seats) {
    const byAssetType = seat.userId
      ? await tx
          .select({
            assetType: assetInsertions.assetType,
            count: sql<number>`count(*)::int`,
          })
          .from(assetInsertions)
          .where(
            and(
              eq(assetInsertions.organizationId, input.organizationId),
              eq(assetInsertions.userId, seat.userId),
              gte(assetInsertions.createdAt, input.periodStart),
              lt(assetInsertions.createdAt, input.periodEnd),
            ),
          )
          .groupBy(assetInsertions.assetType)
      : [];

    const totalUsed = byAssetType.reduce((sum, row) => sum + row.count, 0);

    results.push({
      seatId: seat.seatId,
      userId: seat.userId,
      email: seat.email,
      name: seat.name,
      status: seat.status,
      totalUsed,
      byAssetType: byAssetType.map((row) => ({
        assetType: row.assetType,
        count: row.count,
      })),
    });
  }

  return results;
}
