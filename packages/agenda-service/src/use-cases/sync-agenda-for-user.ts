import { buildAnalyticsMetadata } from "@deck-pack/agenda";
import type { z } from "zod";

import { AgendaSyncFailedError } from "../domain/errors";
import type { AgendaServiceRepository } from "../repositories/agenda-service-repository";
import type { syncAgendaInputSchema } from "../schemas";

type SyncAgendaInput = {
  userId: string;
} & z.infer<typeof syncAgendaInputSchema>;

export class SyncAgendaForUser {
  constructor(private readonly repo: AgendaServiceRepository) {}

  async execute(input: SyncAgendaInput): Promise<{ instanceId: string; revision: number }> {
    const existing = await this.repo.findInstance({
      userId: input.userId,
      documentAgendaId: input.configuration.agendaId,
    });

    const skipSnapshotUpdate =
      existing !== null && input.configuration.revision < existing.revision;

    const instance = await this.repo.sync({
      userId: input.userId,
      documentAgendaId: input.configuration.agendaId,
      schemaVersion: input.configuration.schemaVersion,
      revision: input.configuration.revision,
      configuration: input.configuration,
      configurationHash: input.configurationHash,
      sectionCount: input.metadata.sectionCount,
      generatedSlideCount: input.metadata.generatedSlideCount,
      skipSnapshotUpdate,
      event: {
        id: input.eventId,
        eventType: input.eventType,
        client: input.client,
        revision: input.configuration.revision,
        durationMs: input.durationMs,
        metadata: buildAnalyticsMetadata(
          input.configuration,
          undefined,
          input.eventType === "repaired",
        ),
      },
    });

    if (!instance) {
      throw new AgendaSyncFailedError();
    }

    return {
      instanceId: instance.id,
      revision: instance.revision,
    };
  }
}
