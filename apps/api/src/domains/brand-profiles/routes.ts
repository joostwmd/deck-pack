import { z } from "zod";

import {
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
} from "@deck-pack/presentation-check";

import { protectedProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import { BRAND_PROFILE_SCHEMA_VERSION } from "./mappers";
import type { BrandProfileService } from "./service";

const profileIdSchema = z.object({ profileId: z.string().uuid() });

export function createBrandProfileRoutes(service: BrandProfileService) {
  return {
    list: protectedProcedure
      .output(z.array(brandProfileSummarySchema))
      .query(async ({ ctx }) => {
        return unwrapServiceResult(await service.list(ctx.tx, { userId: ctx.session!.user.id }));
      }),

    get: protectedProcedure
      .input(profileIdSchema.extend({ versionId: z.string().uuid().optional() }))
      .output(brandProfileDetailSchema)
      .query(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.get(ctx.tx, {
            userId: ctx.session!.user.id,
            profileId: input.profileId,
            versionId: input.versionId,
          }),
        );
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
        return unwrapServiceResult(
          await service.create(ctx.tx, {
            userId: ctx.session!.user.id,
            ...input,
          }),
        );
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
        return unwrapServiceResult(
          await service.update(ctx.tx, {
            userId: ctx.session!.user.id,
            ...input,
          }),
        );
      }),

    duplicate: protectedProcedure
      .input(profileIdSchema.extend({ name: z.string().trim().min(1).max(120) }))
      .output(brandProfileDetailSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.duplicate(ctx.tx, {
            userId: ctx.session!.user.id,
            profileId: input.profileId,
            name: input.name,
          }),
        );
      }),

    setDefault: protectedProcedure
      .input(profileIdSchema)
      .output(z.object({ id: z.string(), isDefault: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.setDefault(ctx.tx, {
            userId: ctx.session!.user.id,
            profileId: input.profileId,
          }),
        );
      }),

    archive: protectedProcedure
      .input(profileIdSchema)
      .output(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.archive(ctx.tx, {
            userId: ctx.session!.user.id,
            profileId: input.profileId,
          }),
        );
      }),
  };
}

export { BRAND_PROFILE_SCHEMA_VERSION };
