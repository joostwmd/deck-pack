import { buildAnalyticsMetadata } from "@deck-pack/agenda";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import type { syncAgenda, SyncAgendaInput } from "@deck-pack/db/queries/syncAgenda";

import type { syncAgendaInputSchema } from "./schemas";
import type { z } from "zod";

export type AgendaServiceDeps = {
  syncAgenda: typeof syncAgenda;
  getAgendaInstance: typeof getAgendaInstance;
};

export function createAgendaService(deps: AgendaServiceDeps) {
  return {
    syncForUser: async (
      tx: Transaction,
      input: {
        userId: string;
      } & z.infer<typeof syncAgendaInputSchema>,
    ): Promise<ServiceResult<{ instanceId: string; revision: number }>> => {
      const existing = await deps.getAgendaInstance({
        tx,
        userId: input.userId,
        documentAgendaId: input.configuration.agendaId,
      });

      const skipSnapshotUpdate =
        existing !== null && input.configuration.revision < existing.revision;

      const syncInput: SyncAgendaInput = {
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
      };

      const instance = await deps.syncAgenda({ tx, input: syncInput });

      if (!instance) {
        return serviceFail("internal", { message: "Failed to sync agenda" });
      }

      return serviceOk({
        instanceId: instance.id,
        revision: instance.revision,
      });
    },

    getForUser: async (
      tx: Transaction,
      input: { userId: string; documentAgendaId: string },
    ) => {
      const instance = await deps.getAgendaInstance({
        tx,
        userId: input.userId,
        documentAgendaId: input.documentAgendaId,
      });

      if (!instance) {
        return serviceFail("not_found", { message: "Agenda not found" });
      }

      return serviceOk(instance);
    },
  };
}

export type AgendaService = ReturnType<typeof createAgendaService>;
