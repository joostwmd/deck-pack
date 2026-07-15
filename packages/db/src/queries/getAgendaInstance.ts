import { and, eq } from "drizzle-orm";

import { agendaInstances } from "../schema/agendas";
import type { Transaction } from "../transaction";

export async function getAgendaInstance({
  tx,
  userId,
  documentAgendaId,
}: {
  tx: Transaction;
  userId: string;
  documentAgendaId: string;
}) {
  const [instance] = await tx
    .select()
    .from(agendaInstances)
    .where(
      and(
        eq(agendaInstances.userId, userId),
        eq(agendaInstances.documentAgendaId, documentAgendaId),
      ),
    )
    .limit(1);

  return instance ?? null;
}
