ALTER TABLE "library_items" RENAME TO "gallery_items";
--> statement-breakpoint
ALTER TABLE "library_item_names" RENAME TO "gallery_item_names";
--> statement-breakpoint
ALTER INDEX "library_items_feed_idx" RENAME TO "gallery_items_feed_idx";
--> statement-breakpoint
ALTER INDEX "library_items_organizationId_idx" RENAME TO "gallery_items_organizationId_idx";
--> statement-breakpoint
ALTER INDEX "library_items_createdByUserId_idx" RENAME TO "gallery_items_createdByUserId_idx";
--> statement-breakpoint
ALTER INDEX "library_items_ready_feed_idx" RENAME TO "gallery_items_ready_feed_idx";
--> statement-breakpoint
ALTER INDEX "library_item_names_normalized_name_idx" RENAME TO "gallery_item_names_normalized_name_idx";
--> statement-breakpoint
ALTER INDEX "library_item_names_library_item_id_idx" RENAME TO "gallery_item_names_gallery_item_id_idx";
--> statement-breakpoint
ALTER INDEX "library_item_names_item_normalized_uidx" RENAME TO "gallery_item_names_item_normalized_uidx";
--> statement-breakpoint
ALTER TABLE "gallery_item_names" RENAME COLUMN "library_item_id" TO "gallery_item_id";
--> statement-breakpoint
ALTER TABLE "shape_items" RENAME COLUMN "library_item_id" TO "gallery_item_id";
--> statement-breakpoint
ALTER TABLE "slide_items" RENAME COLUMN "library_item_id" TO "gallery_item_id";
--> statement-breakpoint
ALTER TABLE "flag_items" RENAME COLUMN "library_item_id" TO "gallery_item_id";
--> statement-breakpoint
ALTER TABLE "gallery_items" RENAME CONSTRAINT "library_items_organization_id_organization_id_fk" TO "gallery_items_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "gallery_items" RENAME CONSTRAINT "library_items_created_by_user_id_user_id_fk" TO "gallery_items_created_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "gallery_item_names" RENAME CONSTRAINT "library_item_names_library_item_id_library_items_id_fk" TO "gallery_item_names_gallery_item_id_gallery_items_id_fk";
--> statement-breakpoint
ALTER TABLE "shape_items" RENAME CONSTRAINT "shape_items_library_item_id_library_items_id_fk" TO "shape_items_gallery_item_id_gallery_items_id_fk";
--> statement-breakpoint
ALTER TABLE "slide_items" RENAME CONSTRAINT "slide_items_library_item_id_library_items_id_fk" TO "slide_items_gallery_item_id_gallery_items_id_fk";
--> statement-breakpoint
ALTER TABLE "flag_items" RENAME CONSTRAINT "flag_items_library_item_id_library_items_id_fk" TO "flag_items_gallery_item_id_gallery_items_id_fk";
--> statement-breakpoint
ALTER TABLE "flag_variants" RENAME CONSTRAINT "flag_variants_flag_item_id_flag_items_library_item_id_fk" TO "flag_variants_flag_item_id_flag_items_gallery_item_id_fk";
