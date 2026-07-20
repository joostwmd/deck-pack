import { and, count, eq, inArray } from "drizzle-orm";

import { organizationSeats } from "../schema/billing";
import type { Transaction } from "../transaction";

export async function countAssignedSeats({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<number> {
  const [row] = await tx
    .select({ value: count() })
    .from(organizationSeats)
    .where(
      and(
        eq(organizationSeats.organizationId, organizationId),
        inArray(organizationSeats.status, ["pending", "active"]),
      ),
    );

  return Number(row?.value ?? 0);
}
