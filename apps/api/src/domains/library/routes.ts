import { z } from "zod";

import { platformAdminProcedure } from "../../trpc/procedures";
import { unwrapServiceResult } from "../../trpc/service-result";

import {
  libraryAssetClassSchema,
  libraryCategorySchema,
  libraryItemDetailSchema,
  libraryListItemSchema,
  libraryUploadRoleSchema,
  slideAspectRatioSchema,
  uploadTargetSchema,
} from "./schemas";
import type { LibraryService } from "./service";

export function createLibraryRoutes(service: LibraryService) {
  return {
    list: platformAdminProcedure
      .input(
        z.object({
          assetClass: libraryAssetClassSchema,
          includeArchived: z.boolean().optional(),
        }),
      )
      .output(z.array(libraryListItemSchema))
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.list(ctx.tx, input));
      }),

    get: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.get(ctx.tx, input));
      }),

    create: platformAdminProcedure
      .input(
        z.object({
          assetClass: libraryAssetClassSchema,
          displayName: z.string().trim().min(1).max(256),
          aliases: z.array(z.string().trim().min(1).max(256)).max(50).optional(),
          flagCode: z.string().trim().min(1).max(16).optional(),
          category: libraryCategorySchema.optional(),
          aspectRatio: slideAspectRatioSchema.optional(),
        }),
      )
      .output(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.create(ctx.tx, {
            ...input,
            createdByUserId: ctx.session!.user.id,
          }),
        );
      }),

    update: platformAdminProcedure
      .input(
        z.object({
          id: z.string().trim().min(1),
          displayName: z.string().trim().min(1).max(256),
          aliases: z.array(z.string().trim().min(1).max(256)).max(50),
          flagCode: z.string().trim().min(1).max(16).optional(),
          category: libraryCategorySchema.optional(),
          aspectRatio: slideAspectRatioSchema.optional(),
        }),
      )
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.update(ctx.tx, input));
      }),

    publish: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.publish(ctx.tx, input));
      }),

    unpublish: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.unpublish(ctx.tx, input));
      }),

    archive: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.archive(ctx.tx, input));
      }),

    createUploadTarget: platformAdminProcedure
      .input(
        z.object({
          id: z.string().trim().min(1),
          role: libraryUploadRoleSchema,
          contentType: z.string().trim().min(1).max(256),
          byteSize: z
            .number()
            .int()
            .positive()
            .max(100 * 1024 * 1024),
        }),
      )
      .output(uploadTargetSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.createUploadTarget(ctx.tx, input));
      }),

    finalizeUpload: platformAdminProcedure
      .input(
        z.object({
          id: z.string().trim().min(1),
          role: libraryUploadRoleSchema,
          key: z.string().trim().min(1),
          contentType: z.string().trim().min(1).max(256),
        }),
      )
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.finalizeUpload(ctx.tx, input));
      }),

    putAndFinalize: platformAdminProcedure
      .input(
        z.object({
          id: z.string().trim().min(1),
          role: libraryUploadRoleSchema,
          key: z.string().trim().min(1),
          contentType: z.string().trim().min(1).max(256),
          dataBase64: z.string().min(1),
        }),
      )
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(await service.putAndFinalize(ctx.tx, input));
      }),
  };
}
