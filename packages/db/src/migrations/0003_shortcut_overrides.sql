CREATE TABLE "shortcut_overrides" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "shortcut_id" text NOT NULL,
  "hotkey" text NOT NULL,
  "schema_version" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shortcut_overrides" ADD CONSTRAINT "shortcut_overrides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "shortcut_overrides_userId_shortcutId_schemaVersion_uidx" ON "shortcut_overrides" USING btree ("user_id","shortcut_id","schema_version");
--> statement-breakpoint
CREATE INDEX "shortcut_overrides_userId_schemaVersion_idx" ON "shortcut_overrides" USING btree ("user_id","schema_version");
