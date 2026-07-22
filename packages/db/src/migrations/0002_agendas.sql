CREATE TABLE "agenda_instances" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "document_agenda_id" text NOT NULL,
  "schema_version" integer DEFAULT 1 NOT NULL,
  "revision" integer DEFAULT 0 NOT NULL,
  "configuration" jsonb NOT NULL,
  "configuration_hash" text NOT NULL,
  "section_count" integer DEFAULT 0 NOT NULL,
  "generated_slide_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_events" (
  "id" text PRIMARY KEY NOT NULL,
  "agenda_instance_id" text NOT NULL,
  "user_id" text NOT NULL,
  "event_type" text NOT NULL,
  "client" text NOT NULL,
  "revision" integer NOT NULL,
  "duration_ms" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agenda_instances" ADD CONSTRAINT "agenda_instances_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_agenda_instance_id_agenda_instances_id_fk" FOREIGN KEY ("agenda_instance_id") REFERENCES "public"."agenda_instances"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_instances_userId_documentAgendaId_uidx" ON "agenda_instances" USING btree ("user_id","document_agenda_id");
--> statement-breakpoint
CREATE INDEX "agenda_instances_userId_idx" ON "agenda_instances" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "agenda_instances_updatedAt_idx" ON "agenda_instances" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX "agenda_instances_configurationHash_idx" ON "agenda_instances" USING btree ("configuration_hash");
--> statement-breakpoint
CREATE INDEX "agenda_events_agendaInstanceId_idx" ON "agenda_events" USING btree ("agenda_instance_id");
--> statement-breakpoint
CREATE INDEX "agenda_events_userId_idx" ON "agenda_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "agenda_events_eventType_idx" ON "agenda_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX "agenda_events_createdAt_idx" ON "agenda_events" USING btree ("created_at");
