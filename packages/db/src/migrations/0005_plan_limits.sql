CREATE TABLE "plan_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"inserts_per_month" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_limits_planId_assetType_uidx" ON "plan_limits" USING btree ("plan_id","asset_type");--> statement-breakpoint
CREATE INDEX "plan_limits_planId_idx" ON "plan_limits" USING btree ("plan_id");--> statement-breakpoint
INSERT INTO "plan_limits" ("id", "plan_id", "asset_type", "inserts_per_month")
SELECT gen_random_uuid()::text, p."id", a.asset_type, p."inserts_per_month"
FROM "plans" p
CROSS JOIN (
	VALUES
		('logo'),
		('flag'),
		('icon'),
		('harvey_ball'),
		('photo'),
		('slide'),
		('shape')
) AS a(asset_type)
WHERE EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'plans'
		AND column_name = 'inserts_per_month'
);--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN IF EXISTS "inserts_per_month";
