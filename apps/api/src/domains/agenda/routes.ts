import { TRPCError } from "@trpc/server";

import { buildAnalyticsMetadata, buildConfigurationHash } from "@deck-pack/agenda";
import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";

import { protectedProcedure } from "../../api/procedures";

import {
  getAgendaInputSchema,
  getAgendaOutputSchema,
  syncAgendaInputSchema,
  syncAgendaOutputSchema,
} from "./schemas";

export const agendaRoutes = {
  sync: protectedProcedure
    .input(syncAgendaInputSchema)
    .output(syncAgendaOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await syncAgenda({
        tx: ctx.tx,
        input: {
          userId: ctx.session!.user.id,
          documentAgendaId: input.configuration.agendaId,
          schemaVersion: input.configuration.schemaVersion,
          revision: input.configuration.revision,
          configuration: input.configuration,
          configurationHash: input.configurationHash,
          sectionCount: input.metadata.sectionCount,
          generatedSlideCount: input.metadata.generatedSlideCount,
          event: {
            id: input.eventId,
            eventType: input.eventType,
            client: input.client,
            revision: input.configuration.revision,
            durationMs: input.durationMs,
            metadata: buildAnalyticsMetadata(input.configuration, undefined, input.eventType === "repaired"),
          },
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync agenda",
        });
      }

      return {
        instanceId: instance.id,
        revision: instance.revision,
      };
    }),

  get: protectedProcedure
    .input(getAgendaInputSchema)
    .output(getAgendaOutputSchema)
    .query(async ({ ctx, input }) => {
      const instance = await getAgendaInstance({
        tx: ctx.tx,
        userId: ctx.session!.user.id,
        documentAgendaId: input.documentAgendaId,
      });

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agenda not found" });
      }

      return getAgendaOutputSchema.parse({
        id: instance.id,
        documentAgendaId: instance.documentAgendaId,
        schemaVersion: instance.schemaVersion,
        revision: instance.revision,
        configuration: instance.configuration,
        configurationHash: instance.configurationHash,
        sectionCount: instance.sectionCount,
        generatedSlideCount: instance.generatedSlideCount,
        updatedAt: instance.updatedAt,
        lastSyncedAt: instance.lastSyncedAt,
      });
    }),
};

export function buildAgendaSyncPayload(
  configuration: Parameters<typeof buildConfigurationHash>[0],
  eventType: "created" | "updated" | "repaired" | "deleted",
  eventId: string,
  durationMs?: number,
) {
  return {
    configuration,
    configurationHash: buildConfigurationHash(configuration),
    eventId,
    eventType,
    client: "office" as const,
    durationMs,
    metadata: buildAnalyticsMetadata(configuration),
  };
}
