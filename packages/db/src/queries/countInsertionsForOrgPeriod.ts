import { and, eq, gte, lt, sql } from "drizzle-orm";

import { assetInsertions } from "../schema/asset-insertions";
import type { Transaction } from "../transaction";

export type CountInsertionsForOrgPeriodInput = {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  assetType?: string;
  userId?: string;
};

export async function countInsertionsForOrgPeriod({
  tx,
  input,
}: {
  tx: Transaction;
  input: CountInsertionsForOrgPeriodInput;
}): Promise<number> {
  const conditions = [
    eq(assetInsertions.organizationId, input.organizationId),
    gte(assetInsertions.createdAt, input.periodStart),
    lt(assetInsertions.createdAt, input.periodEnd),
  ];

  if (input.assetType) {
    conditions.push(eq(assetInsertions.assetType, input.assetType));
  }

  if (input.userId) {
    conditions.push(eq(assetInsertions.userId, input.userId));
  }

  const [row] = await tx
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(assetInsertions)
    .where(and(...conditions));

  return row?.count ?? 0;
}
