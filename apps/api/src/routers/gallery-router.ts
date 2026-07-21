import { z } from "zod";

import {
  ArchiveGalleryItem,
  CreateGalleryItem,
  CreateGalleryUploadTarget,
  FinalizeGalleryUpload,
  GetGalleryItem,
  ListGalleryItems,
  PublishGalleryItem,
  PutAndFinalizeGalleryUpload,
  UnpublishGalleryItem,
  UpdateGalleryItem,
} from "@deck-pack/gallery";
import {
  libraryAssetClassSchema,
  libraryCategorySchema,
  libraryItemDetailSchema,
  libraryListItemSchema,
  libraryUploadRoleSchema,
  slideAspectRatioSchema,
  uploadTargetSchema,
} from "@deck-pack/gallery/schemas";

import type { AppContainer } from "../container";
import { requireActiveOrganizationId } from "../trpc/guards/assertions/require-active-organization-id";
import { requirePermission } from "../trpc/guards/middleware/require-permission";
import { platformAdminProcedure, teamWorkspaceProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

const GLOBAL = { kind: "global" as const };

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

function createItemInputSchema() {
  return z.object({
    assetClass: libraryAssetClassSchema,
    displayName: z.string().trim().min(1).max(256),
    aliases: z.array(z.string().trim().min(1).max(256)).max(50).optional(),
    flagCode: z.string().trim().min(1).max(16).optional(),
    category: libraryCategorySchema.optional(),
    aspectRatio: slideAspectRatioSchema.optional(),
  });
}

function updateItemInputSchema() {
  return z.object({
    id: z.string().trim().min(1),
    displayName: z.string().trim().min(1).max(256),
    aliases: z.array(z.string().trim().min(1).max(256)).max(50),
    flagCode: z.string().trim().min(1).max(16).optional(),
    category: libraryCategorySchema.optional(),
    aspectRatio: slideAspectRatioSchema.optional(),
  });
}

function createUploadTargetInputSchema() {
  return z.object({
    id: z.string().trim().min(1),
    role: libraryUploadRoleSchema,
    contentType: z.string().trim().min(1).max(256),
    byteSize: z
      .number()
      .int()
      .positive()
      .max(100 * 1024 * 1024),
  });
}

function finalizeUploadInputSchema() {
  return z.object({
    id: z.string().trim().min(1),
    role: libraryUploadRoleSchema,
    key: z.string().trim().min(1),
    contentType: z.string().trim().min(1).max(256),
  });
}

function putAndFinalizeInputSchema() {
  return z.object({
    id: z.string().trim().min(1),
    role: libraryUploadRoleSchema,
    key: z.string().trim().min(1),
    contentType: z.string().trim().min(1).max(256),
    dataBase64: z.string().min(1),
  });
}

function globalLibraryRoutes(container: AppContainer) {
  return {
    list: platformAdminProcedure
      .input(
        z.object({
          assetClass: libraryAssetClassSchema,
          includeArchived: z.boolean().optional(),
        }),
      )
      .output(z.array(libraryListItemSchema))
      .query(({ input }) => {
        return new ListGalleryItems(container.galleryRepository, container.objectStorage).execute(
          GLOBAL,
          input,
        );
      }),

    get: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .query(({ input }) => {
        return new GetGalleryItem(container.galleryRepository).execute(GLOBAL, input);
      }),

    create: platformAdminProcedure
      .input(createItemInputSchema())
      .output(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => {
        return new CreateGalleryItem(container.galleryRepository).execute(GLOBAL, {
          ...input,
          createdByUserId: ctx.session!.user.id,
        });
      }),

    update: platformAdminProcedure
      .input(updateItemInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new UpdateGalleryItem(container.galleryRepository).execute(GLOBAL, input);
      }),

    publish: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new PublishGalleryItem(container.galleryRepository).execute(GLOBAL, input);
      }),

    unpublish: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new UnpublishGalleryItem(container.galleryRepository).execute(GLOBAL, input);
      }),

    archive: platformAdminProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new ArchiveGalleryItem(container.galleryRepository).execute(GLOBAL, input);
      }),

    createUploadTarget: platformAdminProcedure
      .input(createUploadTargetInputSchema())
      .output(uploadTargetSchema)
      .mutation(({ input }) => {
        return new CreateGalleryUploadTarget(
          container.galleryRepository,
          container.objectStorage,
        ).execute(GLOBAL, input);
      }),

    finalizeUpload: platformAdminProcedure
      .input(finalizeUploadInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new FinalizeGalleryUpload(
          container.galleryRepository,
          container.objectStorage,
        ).execute(GLOBAL, input);
      }),

    putAndFinalize: platformAdminProcedure
      .input(putAndFinalizeInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ input }) => {
        return new PutAndFinalizeGalleryUpload(
          container.galleryRepository,
          container.objectStorage,
        ).execute(GLOBAL, input);
      }),
  };
}

function orgLibraryRoutes(container: AppContainer) {
  return {
    list: orgLibraryReadProcedure
      .input(
        z.object({
          assetClass: libraryAssetClassSchema,
          includeArchived: z.boolean().optional(),
        }),
      )
      .output(z.array(libraryListItemSchema))
      .query(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new ListGalleryItems(container.galleryRepository, container.objectStorage).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    get: orgLibraryReadProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .query(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new GetGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    create: orgLibraryCreateProcedure
      .input(createItemInputSchema())
      .output(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new CreateGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          {
            ...input,
            createdByUserId: ctx.session!.user.id,
          },
        );
      }),

    update: orgLibraryUpdateProcedure
      .input(updateItemInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new UpdateGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    publish: orgLibraryUpdateProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new PublishGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    unpublish: orgLibraryUpdateProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new UnpublishGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    archive: orgLibraryDeleteProcedure
      .input(z.object({ id: z.string().trim().min(1) }))
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new ArchiveGalleryItem(container.galleryRepository).execute(
          { kind: "org", organizationId },
          input,
        );
      }),

    createUploadTarget: orgLibraryCreateProcedure
      .input(createUploadTargetInputSchema())
      .output(uploadTargetSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new CreateGalleryUploadTarget(
          container.galleryRepository,
          container.objectStorage,
        ).execute({ kind: "org", organizationId }, input);
      }),

    finalizeUpload: orgLibraryCreateProcedure
      .input(finalizeUploadInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new FinalizeGalleryUpload(
          container.galleryRepository,
          container.objectStorage,
        ).execute({ kind: "org", organizationId }, input);
      }),

    putAndFinalize: orgLibraryCreateProcedure
      .input(putAndFinalizeInputSchema())
      .output(libraryItemDetailSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new PutAndFinalizeGalleryUpload(
          container.galleryRepository,
          container.objectStorage,
        ).execute({ kind: "org", organizationId }, input);
      }),
  };
}

/** Mounted as `library` (and `library.org`) to keep existing client paths stable. */
export function galleryRouter(container: AppContainer) {
  return router({
    ...globalLibraryRoutes(container),
    org: router(orgLibraryRoutes(container)),
  });
}
