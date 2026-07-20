import { z } from "zod";

import { teamWorkspaceProcedure } from "../../api/procedures";
import { requirePermission } from "../../api/guards/authorization";
import { requireActiveOrganizationId } from "../../api/guards/org-context";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  libraryAssetClassSchema,
  libraryCategorySchema,
  libraryItemDetailSchema,
  libraryListItemSchema,
  libraryUploadRoleSchema,
  slideAspectRatioSchema,
  uploadTargetSchema,
} from "./schemas";
import type { OrgLibraryService } from "./org-service";

const orgLibraryCreateProcedure = teamWorkspaceProcedure.use(
  requirePermission({ library: ["create"] }),
);

const orgLibraryUpdateProcedure = teamWorkspaceProcedure.use(
  requirePermission({ library: ["update"] }),
);

const orgLibraryDeleteProcedure = teamWorkspaceProcedure.use(
  requirePermission({ library: ["delete"] }),
);

const orgLibraryReadProcedure = teamWorkspaceProcedure.use(
  requirePermission({ library: ["create"] }),
);

export function createOrgLibraryRoutes(service: OrgLibraryService) {
  return {
    list: orgLibraryReadProcedure
      .input(
        z.object({
          assetClass: libraryAssetClassSchema,
          includeArchived: z.boolean().optional(),
        }),
      )
      .output(z.array(libraryListItemSchema))
      .query(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.list(ctx.tx, { organizationId, ...input }),
        );
      }),

    get: orgLibraryReadProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .query(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.get(ctx.tx, { organizationId, id: input.id }),
        );
      }),

    create: orgLibraryCreateProcedure
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
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.create(ctx.tx, {
            ...input,
            organizationId,
            createdByUserId: ctx.session!.user.id,
          }),
        );
      }),

    update: orgLibraryUpdateProcedure
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
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.update(ctx.tx, { organizationId, ...input }),
        );
      }),

    publish: orgLibraryUpdateProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.publish(ctx.tx, { organizationId, id: input.id }),
        );
      }),

    unpublish: orgLibraryUpdateProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.unpublish(ctx.tx, { organizationId, id: input.id }),
        );
      }),

    archive: orgLibraryDeleteProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.archive(ctx.tx, { organizationId, id: input.id }),
        );
      }),

    createUploadTarget: orgLibraryCreateProcedure
      .input(
        z.object({
          id: z.string().trim().min(1),
          role: libraryUploadRoleSchema,
          contentType: z.string().trim().min(1).max(256),
          byteSize: z.number().int().positive().max(100 * 1024 * 1024),
        }),
      )
      .output(uploadTargetSchema)
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.createUploadTarget(ctx.tx, { organizationId, ...input }),
        );
      }),

    finalizeUpload: orgLibraryCreateProcedure
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
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.finalizeUpload(ctx.tx, { organizationId, ...input }),
        );
      }),

    putAndFinalize: orgLibraryCreateProcedure
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
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.putAndFinalize(ctx.tx, { organizationId, ...input }),
        );
      }),
  };
}
