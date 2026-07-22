import { z } from "zod";

import {
  ArchiveBrandProfile,
  CreateBrandProfile,
  DuplicateBrandProfile,
  GetBrandProfile,
  ListBrandProfiles,
  SetDefaultBrandProfile,
  UpdateBrandProfile,
} from "@deck-pack/brand-profiles";
import {
  archiveResultSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
  createBrandProfileInputSchema,
  duplicateBrandProfileInputSchema,
  getBrandProfileInputSchema,
  profileIdSchema,
  setDefaultResultSchema,
  updateBrandProfileInputSchema,
} from "@deck-pack/brand-profiles/schemas";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function brandProfilesRouter(container: AppContainer) {
  return router({
    list: protectedProcedure.output(z.array(brandProfileSummarySchema)).query(({ ctx }) => {
      return new ListBrandProfiles(container.brandProfilesRepository).execute({
        userId: ctx.session!.user.id,
      });
    }),

    get: protectedProcedure
      .input(getBrandProfileInputSchema)
      .output(brandProfileDetailSchema)
      .query(({ ctx, input }) => {
        return new GetBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          profileId: input.profileId,
          versionId: input.versionId,
        });
      }),

    create: protectedProcedure
      .input(createBrandProfileInputSchema)
      .output(brandProfileDetailSchema)
      .mutation(({ ctx, input }) => {
        return new CreateBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(updateBrandProfileInputSchema)
      .output(brandProfileDetailSchema)
      .mutation(({ ctx, input }) => {
        return new UpdateBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          ...input,
        });
      }),

    duplicate: protectedProcedure
      .input(duplicateBrandProfileInputSchema)
      .output(brandProfileDetailSchema)
      .mutation(({ ctx, input }) => {
        return new DuplicateBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          profileId: input.profileId,
          name: input.name,
        });
      }),

    setDefault: protectedProcedure
      .input(profileIdSchema)
      .output(setDefaultResultSchema)
      .mutation(({ ctx, input }) => {
        return new SetDefaultBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          profileId: input.profileId,
        });
      }),

    archive: protectedProcedure
      .input(profileIdSchema)
      .output(archiveResultSchema)
      .mutation(({ ctx, input }) => {
        return new ArchiveBrandProfile(container.brandProfilesRepository).execute({
          userId: ctx.session!.user.id,
          profileId: input.profileId,
        });
      }),
  });
}
