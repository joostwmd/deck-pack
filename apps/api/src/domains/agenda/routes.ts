import { protectedProcedure } from "../../trpc/procedures";
import { unwrapServiceResult } from "../../trpc/service-result";

import {
  getAgendaInputSchema,
  getAgendaOutputSchema,
  syncAgendaInputSchema,
  syncAgendaOutputSchema,
} from "./schemas";
import type { AgendaService } from "./service";

export function createAgendaRoutes(service: AgendaService) {
  return {
    sync: protectedProcedure
      .input(syncAgendaInputSchema)
      .output(syncAgendaOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.syncForUser(ctx.tx, {
            userId: ctx.session!.user.id,
            ...input,
          }),
        );
      }),

    get: protectedProcedure
      .input(getAgendaInputSchema)
      .output(getAgendaOutputSchema)
      .query(async ({ ctx, input }) => {
        const instance = unwrapServiceResult(
          await service.getForUser(ctx.tx, {
            userId: ctx.session!.user.id,
            documentAgendaId: input.documentAgendaId,
          }),
        );
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
}
