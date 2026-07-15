import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const agendaInstances = pgTable(
  "agenda_instances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    documentAgendaId: text("document_agenda_id").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    revision: integer("revision").notNull().default(0),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
    configurationHash: text("configuration_hash").notNull(),
    sectionCount: integer("section_count").notNull().default(0),
    generatedSlideCount: integer("generated_slide_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("agenda_instances_userId_documentAgendaId_uidx").on(
      table.userId,
      table.documentAgendaId,
    ),
    index("agenda_instances_userId_idx").on(table.userId),
    index("agenda_instances_updatedAt_idx").on(table.updatedAt),
    index("agenda_instances_configurationHash_idx").on(table.configurationHash),
  ],
);

export const agendaEvents = pgTable(
  "agenda_events",
  {
    id: text("id").primaryKey(),
    agendaInstanceId: text("agenda_instance_id")
      .notNull()
      .references(() => agendaInstances.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    client: text("client").notNull(),
    revision: integer("revision").notNull(),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agenda_events_agendaInstanceId_idx").on(table.agendaInstanceId),
    index("agenda_events_userId_idx").on(table.userId),
    index("agenda_events_eventType_idx").on(table.eventType),
    index("agenda_events_createdAt_idx").on(table.createdAt),
  ],
);
