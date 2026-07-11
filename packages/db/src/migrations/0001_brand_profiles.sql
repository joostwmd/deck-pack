CREATE TABLE "brand_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"active_version_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_profile_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"version" integer NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"configuration" jsonb NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "brand_profile_versions" ADD CONSTRAINT "brand_profile_versions_profile_id_brand_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "brand_profile_versions" ADD CONSTRAINT "brand_profile_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "brand_profiles_userId_idx" ON "brand_profiles" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "brand_profiles_userId_name_uidx" ON "brand_profiles" USING btree ("user_id","name");
--> statement-breakpoint
CREATE INDEX "brand_profile_versions_profileId_idx" ON "brand_profile_versions" USING btree ("profile_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "brand_profile_versions_profileId_version_uidx" ON "brand_profile_versions" USING btree ("profile_id","version");
