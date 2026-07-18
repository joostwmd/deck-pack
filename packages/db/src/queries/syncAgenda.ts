import { and, eq } from "drizzle-orm";

import { agendaEvents, agendaInstances } from "../schema/agendas";
import type { Transaction } from "../transaction";

export type SyncAgendaInput = {
  userId: string;
  documentAgendaId: string;
  schemaVersion: number;
  revision: number;
  configuration: Record<string, unknown>;
  configurationHash: string;
  sectionCount: number;
  generatedSlideCount: number;
  skipSnapshotUpdate?: boolean;
  event: {
    id: string;
    eventType: string;
    client: string;
    revision: number;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  };
};

export async function syncAgenda({
  tx,
  input,
}: {
  tx: Transaction;
  input: SyncAgendaInput;
}) {
  const [existing] = await tx
    .select({ id: agendaInstances.id, revision: agendaInstances.revision })
    .from(agendaInstances)
    .where(
      and(
        eq(agendaInstances.userId, input.userId),
        eq(agendaInstances.documentAgendaId, input.documentAgendaId),
      ),
    )
    .limit(1);

  let instanceId = existing?.id;

  if (!existing) {
    const [created] = await tx
      .insert(agendaInstances)
      .values({
        userId: input.userId,
        documentAgendaId: input.documentAgendaId,
        schemaVersion: input.schemaVersion,
        revision: input.revision,
        configuration: input.configuration,
        configurationHash: input.configurationHash,
        sectionCount: input.sectionCount,
        generatedSlideCount: input.generatedSlideCount,
        lastSyncedAt: new Date(),
      })
      .returning({ id: agendaInstances.id });

    if (!created) {
      return null;
    }

    instanceId = created.id;
  } else if (!input.skipSnapshotUpdate) {
    await tx
      .update(agendaInstances)
      .set({
        schemaVersion: input.schemaVersion,
        revision: input.revision,
        configuration: input.configuration,
        configurationHash: input.configurationHash,
        sectionCount: input.sectionCount,
        generatedSlideCount: input.generatedSlideCount,
        lastSyncedAt: new Date(),
      })
      .where(eq(agendaInstances.id, existing.id));
  }

  if (!instanceId) {
    return null;
  }

  const [existingEvent] = await tx
    .select({ id: agendaEvents.id })
    .from(agendaEvents)
    .where(eq(agendaEvents.id, input.event.id))
    .limit(1);

  if (!existingEvent) {
    await tx.insert(agendaEvents).values({
      id: input.event.id,
      agendaInstanceId: instanceId,
      userId: input.userId,
      eventType: input.event.eventType,
      client: input.event.client,
      revision: input.event.revision,
      durationMs: input.event.durationMs,
      metadata: input.event.metadata ?? {},
    });
  }

  const [instance] = await tx
    .select()
    .from(agendaInstances)
    .where(eq(agendaInstances.id, instanceId))
    .limit(1);

  return instance ?? null;
}
