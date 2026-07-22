import { GetAgendaForUser, SyncAgendaForUser } from "@deck-pack/agenda-service";
import {
  getAgendaInputSchema,
  getAgendaOutputSchema,
  syncAgendaInputSchema,
  syncAgendaOutputSchema,
} from "@deck-pack/agenda-service/schemas";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function agendaRouter(container: AppContainer) {
  return router({
    sync: protectedProcedure
      .input(syncAgendaInputSchema)
      .output(syncAgendaOutputSchema)
      .mutation(({ ctx, input }) => {
        return new SyncAgendaForUser(container.agendaServiceRepository).execute({
          userId: ctx.session!.user.id,
          ...input,
        });
      }),

    get: protectedProcedure
      .input(getAgendaInputSchema)
      .output(getAgendaOutputSchema)
      .query(async ({ ctx, input }) => {
        const instance = await new GetAgendaForUser(container.agendaServiceRepository).execute({
          userId: ctx.session!.user.id,
          documentAgendaId: input.documentAgendaId,
        });
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
  });
}
