import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type { AgendaInstance, SyncAgendaRepoInput } from "../domain/agenda-instance";

export type AgendaServiceRepository = {
  findInstance(input: { userId: string; documentAgendaId: string }): Promise<AgendaInstance | null>;
  sync(input: SyncAgendaRepoInput): Promise<AgendaInstance | null>;
};

function mapInstance(
  row: NonNullable<Awaited<ReturnType<typeof getAgendaInstance>>>,
): AgendaInstance {
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

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async findInstance(input: {
    userId: string;
    documentAgendaId: string;
  }): Promise<AgendaInstance | null> {
    const row = await getAgendaInstance({
      tx: this.tx(),
      userId: input.userId,
      documentAgendaId: input.documentAgendaId,
    });
    return row ? mapInstance(row) : null;
  }

  async sync(input: SyncAgendaRepoInput): Promise<AgendaInstance | null> {
    const row = await syncAgenda({ tx: this.tx(), input });
    return row ? mapInstance(row) : null;
  }
}
