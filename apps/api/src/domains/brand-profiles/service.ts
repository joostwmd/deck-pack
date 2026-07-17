import {
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/presentation-check";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import type { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import type {
  createBrandProfile,
  duplicateBrandProfile,
} from "@deck-pack/db/queries/createBrandProfile";
import type { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import type { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import type { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import type { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import type { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";

import { mapBrandProfileDetail, mapBrandProfileSummary } from "./mappers";

export type BrandProfileServiceDeps = {
  listBrandProfilesByUser: typeof listBrandProfilesByUser;
  getBrandProfileWithVersion: typeof getBrandProfileWithVersion;
  createBrandProfile: typeof createBrandProfile;
  createBrandProfileVersion: typeof createBrandProfileVersion;
  updateBrandProfileMetadata: typeof updateBrandProfileMetadata;
  duplicateBrandProfile: typeof duplicateBrandProfile;
  setDefaultBrandProfile: typeof setDefaultBrandProfile;
  archiveBrandProfile: typeof archiveBrandProfile;
};

export function createBrandProfileService(deps: BrandProfileServiceDeps) {
  return {
    list: async (tx: Transaction, input: { userId: string }) => {
      const rows = await deps.listBrandProfilesByUser({ tx, userId: input.userId });
      return serviceOk(rows.map(mapBrandProfileSummary));
    },

    get: async (
      tx: Transaction,
      input: { userId: string; profileId: string; versionId?: string },
    ): Promise<ServiceResult<ReturnType<typeof brandProfileDetailSchema.parse>>> => {
      const loaded = await deps.getBrandProfileWithVersion({
        tx,
        profileId: input.profileId,
        userId: input.userId,
        versionId: input.versionId,
      });

      if (!loaded) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      return serviceOk(mapBrandProfileDetail(loaded));
    },

    create: async (
      tx: Transaction,
      input: {
        userId: string;
        name: string;
        description?: string | null;
        isDefault?: boolean;
        configuration: ReturnType<typeof brandProfileConfigurationSchema.parse>;
      },
    ): Promise<ServiceResult<ReturnType<typeof brandProfileDetailSchema.parse>>> => {
      const configuration = normalizeBrandProfileConfiguration(input.configuration);
      const created = await deps.createBrandProfile({
        tx,
        input: {
          userId: input.userId,
          name: input.name,
          description: input.description,
          isDefault: input.isDefault,
          configuration,
        },
      });

      return serviceOk(
        brandProfileDetailSchema.parse({
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
        }),
      );
    },

    update: async (
      tx: Transaction,
      input: {
        userId: string;
        profileId: string;
        name?: string;
        description?: string | null;
        configuration: ReturnType<typeof brandProfileConfigurationSchema.parse>;
      },
    ): Promise<ServiceResult<ReturnType<typeof brandProfileDetailSchema.parse>>> => {
      const configuration = normalizeBrandProfileConfiguration(input.configuration);
      const version = await deps.createBrandProfileVersion({
        tx,
        profileId: input.profileId,
        userId: input.userId,
        configuration,
      });

      if (!version) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      if (input.name !== undefined || input.description !== undefined) {
        await deps.updateBrandProfileMetadata({
          tx,
          profileId: input.profileId,
          userId: input.userId,
          name: input.name,
          description: input.description,
        });
      }

      const loaded = await deps.getBrandProfileWithVersion({
        tx,
        profileId: input.profileId,
        userId: input.userId,
      });

      if (!loaded) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      return serviceOk(
        brandProfileDetailSchema.parse({
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
        }),
      );
    },

    duplicate: async (
      tx: Transaction,
      input: { userId: string; profileId: string; name: string },
    ): Promise<ServiceResult<ReturnType<typeof brandProfileDetailSchema.parse>>> => {
      const duplicated = await deps.duplicateBrandProfile({
        tx,
        profileId: input.profileId,
        userId: input.userId,
        name: input.name,
      });

      if (!duplicated) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      return serviceOk(
        brandProfileDetailSchema.parse({
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
        }),
      );
    },

    setDefault: async (
      tx: Transaction,
      input: { userId: string; profileId: string },
    ): Promise<ServiceResult<{ id: string; isDefault: boolean }>> => {
      const updated = await deps.setDefaultBrandProfile({
        tx,
        profileId: input.profileId,
        userId: input.userId,
      });

      if (!updated) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      return serviceOk(updated);
    },

    archive: async (
      tx: Transaction,
      input: { userId: string; profileId: string },
    ): Promise<ServiceResult<{ id: string }>> => {
      const archived = await deps.archiveBrandProfile({
        tx,
        profileId: input.profileId,
        userId: input.userId,
      });

      if (!archived) {
        return serviceFail("not_found", { message: "Brand profile not found" });
      }

      return serviceOk(archived);
    },
  };
}

export type BrandProfileService = ReturnType<typeof createBrandProfileService>;
