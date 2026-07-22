import { and, eq } from "drizzle-orm";

import type { UnitOfWork } from "@deck-pack/db";
import { agendaEvents, agendaInstances } from "@deck-pack/db/schema/agendas";

import type { AgendaInstance, SyncAgendaRepoInput } from "../domain/agenda-instance";

export type AgendaServiceRepository = {
  findInstance(input: { userId: string; documentAgendaId: string }): Promise<AgendaInstance | null>;
  sync(input: SyncAgendaRepoInput): Promise<AgendaInstance | null>;
};

type AgendaInstanceRow = typeof agendaInstances.$inferSelect;

function mapInstance(row: AgendaInstanceRow): AgendaInstance {
  return {
    id: row.id,
    userId: row.userId,
    documentAgendaId: row.documentAgendaId,
    schemaVersion: row.schemaVersion,
    revision: row.revision,
    configuration: row.configuration as Record<string, unknown>,
    configurationHash: row.configurationHash,
    sectionCount: row.sectionCount,
    generatedSlideCount: row.generatedSlideCount,
    updatedAt: row.updatedAt,
    lastSyncedAt: row.lastSyncedAt,
  };
}

export class DrizzleAgendaServiceRepository implements AgendaServiceRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async findInstance(input: {
    userId: string;
    documentAgendaId: string;
  }): Promise<AgendaInstance | null> {
    const db = this.uow.getDb();
    const [instance] = await db
      .select()
      .from(agendaInstances)
      .where(
        and(
          eq(agendaInstances.userId, input.userId),
          eq(agendaInstances.documentAgendaId, input.documentAgendaId),
        ),
      )
      .limit(1);

    return instance ? mapInstance(instance) : null;
  }

  async sync(input: SyncAgendaRepoInput): Promise<AgendaInstance | null> {
    const db = this.uow.getDb();
    const [existing] = await db
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
      const [created] = await db
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
      await db
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

    const [existingEvent] = await db
      .select({ id: agendaEvents.id })
      .from(agendaEvents)
      .where(eq(agendaEvents.id, input.event.id))
      .limit(1);

    if (!existingEvent) {
      await db.insert(agendaEvents).values({
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

    const [instance] = await db
      .select()
      .from(agendaInstances)
      .where(eq(agendaInstances.id, instanceId))
      .limit(1);

    return instance ? mapInstance(instance) : null;
  }
}
