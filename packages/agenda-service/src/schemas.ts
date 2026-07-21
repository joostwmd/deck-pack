import { z } from "zod";

import {
  agendaAnalyticsMetadataSchema,
  agendaConfigV1Schema,
  agendaEventTypeSchema,
} from "@deck-pack/agenda";

export const syncAgendaInputSchema = z.object({
  configuration: agendaConfigV1Schema,
  configurationHash: z.string().min(8).max(64),
  eventId: z.string().uuid(),
  eventType: agendaEventTypeSchema,
  client: z.enum(["office", "web"]),
  durationMs: z.number().int().nonnegative().optional(),
  metadata: agendaAnalyticsMetadataSchema,
});

export const syncAgendaOutputSchema = z.object({
  instanceId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
});

export const getAgendaInputSchema = z.object({
  documentAgendaId: z.string().uuid(),
});

export const getAgendaOutputSchema = z.object({
  id: z.string().uuid(),
  documentAgendaId: z.string().uuid(),
  schemaVersion: z.number().int(),
  revision: z.number().int(),
  configuration: agendaConfigV1Schema,
  configurationHash: z.string(),
  sectionCount: z.number().int(),
  generatedSlideCount: z.number().int(),
  updatedAt: z.date(),
  lastSyncedAt: z.date(),
});
