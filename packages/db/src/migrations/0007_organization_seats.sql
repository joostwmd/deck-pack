CREATE TABLE "organization_seats" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_seats" ADD CONSTRAINT "organization_seats_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_seats" ADD CONSTRAINT "organization_seats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_seats" ADD CONSTRAINT "organization_seats_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_seats_org_email_active_uidx" ON "organization_seats" USING btree ("organization_id","email") WHERE "organization_seats"."status" IN ('pending', 'active');
--> statement-breakpoint
CREATE INDEX "organization_seats_organizationId_status_idx" ON "organization_seats" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE INDEX "organization_seats_email_idx" ON "organization_seats" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "organization_seats_userId_idx" ON "organization_seats" USING btree ("user_id");
