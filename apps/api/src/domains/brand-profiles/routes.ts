import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import { createBrandProfile, duplicateBrandProfile } from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";
import {
  BRAND_PROFILE_SCHEMA_VERSION,
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/presentation-check";

import { protectedProcedure } from "../../api/procedures";

const profileIdSchema = z.object({ profileId: z.string().uuid() });

function mapSummary(row: Awaited<ReturnType<typeof listBrandProfilesByUser>>[number]) {
  return brandProfileSummarySchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    isDefault: row.isDefault,
    activeVersionId: row.activeVersionId,
    versionNumber: row.versionNumber,
    schemaVersion: row.schemaVersion,
    configuration: row.configuration
      ? normalizeBrandProfileConfiguration(
          brandProfileConfigurationSchema.parse(row.configuration),
        )
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export const brandProfileRoutes = {
  list: protectedProcedure
    .output(z.array(brandProfileSummarySchema))
    .query(async ({ ctx }) => {
      const rows = await listBrandProfilesByUser({ tx: ctx.tx, userId: ctx.session!.user.id });
      return rows.map(mapSummary);
    }),

  get: protectedProcedure
    .input(profileIdSchema.extend({ versionId: z.string().uuid().optional() }))
    .output(brandProfileDetailSchema)
    .query(async ({ ctx, input }) => {
      const loaded = await getBrandProfileWithVersion({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
        versionId: input.versionId,
      });

      if (!loaded) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      return brandProfileDetailSchema.parse({
        id: loaded.profile.id,
        name: loaded.profile.name,
        description: loaded.profile.description,
        isDefault: loaded.profile.isDefault,
        activeVersionId: loaded.profile.activeVersionId,
        createdAt: loaded.profile.createdAt,
        updatedAt: loaded.profile.updatedAt,
        version: loaded.version
          ? {
              id: loaded.version.id,
              version: loaded.version.version,
              schemaVersion: loaded.version.schemaVersion,
              configuration: normalizeBrandProfileConfiguration(
                brandProfileConfigurationSchema.parse(loaded.version.configuration),
              ),
              createdAt: loaded.version.createdAt,
            }
          : null,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).nullable().optional(),
        isDefault: z.boolean().optional(),
        configuration: brandProfileConfigurationSchema,
      }),
    )
    .output(brandProfileDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const configuration = normalizeBrandProfileConfiguration(input.configuration);
      const created = await createBrandProfile({
        tx: ctx.tx,
        input: {
          userId: ctx.session!.user.id,
          name: input.name,
          description: input.description,
          isDefault: input.isDefault,
          configuration,
        },
      });

      return brandProfileDetailSchema.parse({
        id: created.profile.id,
        name: created.profile.name,
        description: created.profile.description,
        isDefault: created.profile.isDefault,
        activeVersionId: created.profile.activeVersionId,
        createdAt: created.profile.createdAt,
        updatedAt: created.profile.updatedAt,
        version: {
          id: created.version.id,
          version: created.version.version,
          schemaVersion: created.version.schemaVersion,
          configuration,
          createdAt: created.version.createdAt,
        },
      });
    }),

  update: protectedProcedure
    .input(
      profileIdSchema.extend({
        name: z.string().trim().min(1).max(120).optional(),
        description: z.string().trim().max(500).nullable().optional(),
        configuration: brandProfileConfigurationSchema,
      }),
    )
    .output(brandProfileDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const configuration = normalizeBrandProfileConfiguration(input.configuration);
      const version = await createBrandProfileVersion({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
        configuration,
      });

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      if (input.name !== undefined || input.description !== undefined) {
        await updateBrandProfileMetadata({
          tx: ctx.tx,
          profileId: input.profileId,
          userId: ctx.session!.user.id,
          name: input.name,
          description: input.description,
        });
      }

      const loaded = await getBrandProfileWithVersion({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
      });

      if (!loaded) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      return brandProfileDetailSchema.parse({
        id: loaded.profile.id,
        name: input.name ?? loaded.profile.name,
        description: input.description ?? loaded.profile.description,
        isDefault: loaded.profile.isDefault,
        activeVersionId: loaded.profile.activeVersionId,
        createdAt: loaded.profile.createdAt,
        updatedAt: loaded.profile.updatedAt,
        version: {
          id: version.id,
          version: version.version,
          schemaVersion: version.schemaVersion,
          configuration,
          createdAt: version.createdAt,
        },
      });
    }),

  duplicate: protectedProcedure
    .input(profileIdSchema.extend({ name: z.string().trim().min(1).max(120) }))
    .output(brandProfileDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const duplicated = await duplicateBrandProfile({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
        name: input.name,
      });

      if (!duplicated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      return brandProfileDetailSchema.parse({
        id: duplicated.profile.id,
        name: duplicated.profile.name,
        description: duplicated.profile.description,
        isDefault: duplicated.profile.isDefault,
        activeVersionId: duplicated.profile.activeVersionId,
        createdAt: duplicated.profile.createdAt,
        updatedAt: duplicated.profile.updatedAt,
        version: {
          id: duplicated.version.id,
          version: duplicated.version.version,
          schemaVersion: duplicated.version.schemaVersion,
          configuration: normalizeBrandProfileConfiguration(
            brandProfileConfigurationSchema.parse(duplicated.version.configuration),
          ),
          createdAt: duplicated.version.createdAt,
        },
      });
    }),

  setDefault: protectedProcedure
    .input(profileIdSchema)
    .output(z.object({ id: z.string(), isDefault: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await setDefaultBrandProfile({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
      });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      return updated;
    }),

  archive: protectedProcedure
    .input(profileIdSchema)
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const archived = await archiveBrandProfile({
        tx: ctx.tx,
        profileId: input.profileId,
        userId: ctx.session!.user.id,
      });

      if (!archived) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brand profile not found" });
      }

      return archived;
    }),
};

export { BRAND_PROFILE_SCHEMA_VERSION };
