import { type Transaction } from "../transaction";
import { user as userTable } from "../schema/auth";
import { eq } from "drizzle-orm";

export async function isPlatformAdmin({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<boolean> {
  const user = await tx.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  return user?.[0]?.role === "admin";
}
