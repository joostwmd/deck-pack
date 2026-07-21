ALTER TABLE "asset_insertions" ADD COLUMN "organization_id" text;--> statement-breakpoint
UPDATE "asset_insertions" ai
SET "organization_id" = m."organization_id"
FROM "member" m
WHERE ai."user_id" = m."user_id";--> statement-breakpoint
DELETE FROM "asset_insertions" WHERE "organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "asset_insertions" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_insertions" ADD CONSTRAINT "asset_insertions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_insertions_organizationId_assetType_createdAt_idx" ON "asset_insertions" USING btree ("organization_id","asset_type","created_at");--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "external_product_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "plans_externalProductId_uidx" ON "plans" USING btree ("external_product_id") WHERE "external_product_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD COLUMN "provider" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD COLUMN "external_customer_id" text;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD COLUMN "external_subscription_id" text;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD COLUMN "current_period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD COLUMN "current_period_end" timestamp with time zone;--> statement-breakpoint
UPDATE "organization_subscriptions"
SET
  "current_period_start" = date_trunc('month', "created_at" AT TIME ZONE 'UTC'),
  "current_period_end" = date_trunc('month', "created_at" AT TIME ZONE 'UTC') + interval '1 month'
WHERE "current_period_start" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_subscriptions_externalSubscriptionId_uidx" ON "organization_subscriptions" USING btree ("external_subscription_id") WHERE "external_subscription_id" IS NOT NULL;
