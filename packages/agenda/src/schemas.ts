import { z } from "zod";

import {
  AGENDA_EVENT_TYPES,
  AGENDA_ROLES,
  AGENDA_SCHEMA_VERSION,
  FIELD_ROLES,
} from "./constants";

const uuidSchema = z.string().uuid();

export const fieldRoleSchema = z.enum([
  FIELD_ROLES.HEADING,
  FIELD_ROLES.SECTION_NUMBER,
  FIELD_ROLES.SECTION_TITLE,
  FIELD_ROLES.PAGE_NUMBER,
]);

export const agendaRoleSchema = z.enum([
  AGENDA_ROLES.OPENING_TOC,
  AGENDA_ROLES.SECTION_DIVIDER,
  AGENDA_ROLES.SECTION_START,
  AGENDA_ROLES.TEMPLATE,
]);

export const agendaFieldMappingSchema = z.object({
  shapeEntityId: uuidSchema,
  nativeShapeIdHint: z.string().optional(),
  fieldRole: fieldRoleSchema,
});

export const agendaRowSlotSchema = z.object({
  slotId: uuidSchema,
  fields: z.array(agendaFieldMappingSchema).min(1),
});

export const agendaTemplateMappingSchema = z.object({
  templateSlideEntityId: uuidSchema,
  nativeSlideIdHint: z.string().optional(),
  headingShapeEntityId: uuidSchema,
  nativeHeadingShapeIdHint: z.string().optional(),
  rowSlots: z.array(agendaRowSlotSchema).min(1),
  activeStyleSlotId: uuidSchema,
  inactiveStyleSlotId: uuidSchema,
  capacity: z.number().int().positive().max(25),
});

export const agendaSectionSchema = z.object({
  sectionId: uuidSchema,
  title: z.string().trim().min(1).max(200),
  startSlideEntityId: uuidSchema,
  nativeStartSlideIdHint: z.string().optional(),
});

export const generatedSlideRefSchema = z.object({
  entityId: uuidSchema,
  role: agendaRoleSchema,
  sectionId: uuidSchema.optional(),
  nativeSlideIdHint: z.string().optional(),
});

export const agendaOptionsSchema = z.object({
  openingTocEnabled: z.boolean(),
  dividersEnabled: z.boolean(),
  fullAgendaMode: z.boolean().default(true),
  physicalPageNumbers: z.boolean().default(true),
});

export const agendaCloudSyncSchema = z.object({
  lastSyncedRevision: z.number().int().nonnegative(),
  pendingEventIds: z.array(uuidSchema),
});

export const agendaConfigV1Schema = z.object({
  schemaVersion: z.literal(AGENDA_SCHEMA_VERSION),
  agendaId: uuidSchema,
  revision: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  template: agendaTemplateMappingSchema,
  sections: z.array(agendaSectionSchema),
  generatedSlides: z.array(generatedSlideRefSchema),
  options: agendaOptionsSchema,
  cloudSync: agendaCloudSyncSchema,
});

export const agendaEventTypeSchema = z.enum(AGENDA_EVENT_TYPES);

export const agendaAnalyticsMetadataSchema = z.object({
  sectionCount: z.number().int().nonnegative(),
  generatedSlideCount: z.number().int().nonnegative(),
  createdDividers: z.number().int().nonnegative().optional(),
  deletedSlides: z.number().int().nonnegative().optional(),
  movedSlides: z.number().int().nonnegative().optional(),
  updatedSlides: z.number().int().nonnegative().optional(),
  renamedSections: z.number().int().nonnegative().optional(),
  pageNumberRefreshes: z.number().int().nonnegative().optional(),
  repaired: z.boolean().optional(),
});

export function parseAgendaConfig(raw: unknown) {
  return agendaConfigV1Schema.parse(raw);
}

export function safeParseAgendaConfig(raw: unknown) {
  return agendaConfigV1Schema.safeParse(raw);
}

export function createDefaultAgendaOptions() {
  return agendaOptionsSchema.parse({
    openingTocEnabled: true,
    dividersEnabled: true,
    fullAgendaMode: true,
    physicalPageNumbers: true,
  });
}

export function createEmptyCloudSync() {
  return agendaCloudSyncSchema.parse({
    lastSyncedRevision: 0,
    pendingEventIds: [],
  });
}
