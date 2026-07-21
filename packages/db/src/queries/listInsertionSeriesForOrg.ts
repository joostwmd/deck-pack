import { and, eq, gte, lt, sql } from "drizzle-orm";

import { assetInsertions } from "../schema/asset-insertions";
import type { Transaction } from "../transaction";

export type ListInsertionSeriesForOrgInput = {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  userId?: string;
};

export type InsertionSeriesPoint = {
  date: string;
  assetType: string;
  count: number;
};

export async function listInsertionSeriesForOrg({
  tx,
  input,
}: {
  tx: Transaction;
  input: ListInsertionSeriesForOrgInput;
}): Promise<InsertionSeriesPoint[]> {
  const conditions = [
    eq(assetInsertions.organizationId, input.organizationId),
    gte(assetInsertions.createdAt, input.periodStart),
    lt(assetInsertions.createdAt, input.periodEnd),
  ];

  if (input.userId) {
    conditions.push(eq(assetInsertions.userId, input.userId));
  }

  const rows = await tx
    .select({
      date: sql<string>`to_char(date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`,
      assetType: assetInsertions.assetType,
      count: sql<number>`count(*)::int`,
    })
    .from(assetInsertions)
    .where(and(...conditions))
    .groupBy(
      sql`date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC')`,
      assetInsertions.assetType,
    )
    .orderBy(
      sql`date_trunc('day', ${assetInsertions.createdAt} AT TIME ZONE 'UTC')`,
      assetInsertions.assetType,
    );

  return rows;
}
