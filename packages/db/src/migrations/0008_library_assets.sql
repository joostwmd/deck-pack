CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"blob_path" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "files_blob_path_uidx" ON "files" USING btree ("blob_path");
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_class" text NOT NULL,
	"scope" text NOT NULL,
	"organization_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"display_name" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "library_items_feed_idx" ON "library_items" USING btree ("asset_class","status","scope","organization_id");
--> statement-breakpoint
CREATE INDEX "library_items_organizationId_idx" ON "library_items" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "library_items_createdByUserId_idx" ON "library_items" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX "library_items_ready_feed_idx" ON "library_items" USING btree ("asset_class","scope","organization_id") WHERE "library_items"."status" = 'ready';
--> statement-breakpoint
CREATE TABLE "library_item_names" (
	"id" text PRIMARY KEY NOT NULL,
	"library_item_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"kind" text DEFAULT 'alias' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_item_names" ADD CONSTRAINT "library_item_names_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "library_item_names_normalized_name_idx" ON "library_item_names" USING btree ("normalized_name");
--> statement-breakpoint
CREATE INDEX "library_item_names_library_item_id_idx" ON "library_item_names" USING btree ("library_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "library_item_names_item_normalized_uidx" ON "library_item_names" USING btree ("library_item_id","normalized_name");
--> statement-breakpoint
CREATE TABLE "shape_items" (
	"library_item_id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"svg_file_id" text
);
--> statement-breakpoint
ALTER TABLE "shape_items" ADD CONSTRAINT "shape_items_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shape_items" ADD CONSTRAINT "shape_items_svg_file_id_files_id_fk" FOREIGN KEY ("svg_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shape_items_category_idx" ON "shape_items" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "shape_items_svg_file_id_idx" ON "shape_items" USING btree ("svg_file_id");
--> statement-breakpoint
CREATE TABLE "slide_items" (
	"library_item_id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"presentation_file_id" text,
	"thumbnail_file_id" text
);
--> statement-breakpoint
ALTER TABLE "slide_items" ADD CONSTRAINT "slide_items_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slide_items" ADD CONSTRAINT "slide_items_presentation_file_id_files_id_fk" FOREIGN KEY ("presentation_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slide_items" ADD CONSTRAINT "slide_items_thumbnail_file_id_files_id_fk" FOREIGN KEY ("thumbnail_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "slide_items_category_idx" ON "slide_items" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "slide_items_aspect_ratio_idx" ON "slide_items" USING btree ("aspect_ratio");
--> statement-breakpoint
CREATE INDEX "slide_items_presentation_file_id_idx" ON "slide_items" USING btree ("presentation_file_id");
--> statement-breakpoint
CREATE INDEX "slide_items_thumbnail_file_id_idx" ON "slide_items" USING btree ("thumbnail_file_id");
--> statement-breakpoint
CREATE TABLE "flag_items" (
	"library_item_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flag_items" ADD CONSTRAINT "flag_items_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "flag_items_code_idx" ON "flag_items" USING btree ("code");
--> statement-breakpoint
CREATE TABLE "flag_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_item_id" text NOT NULL,
	"role" text NOT NULL,
	"file_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flag_variants" ADD CONSTRAINT "flag_variants_flag_item_id_flag_items_library_item_id_fk" FOREIGN KEY ("flag_item_id") REFERENCES "public"."flag_items"("library_item_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "flag_variants" ADD CONSTRAINT "flag_variants_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "flag_variants_flag_item_id_role_uidx" ON "flag_variants" USING btree ("flag_item_id","role");
--> statement-breakpoint
CREATE INDEX "flag_variants_file_id_idx" ON "flag_variants" USING btree ("file_id");
