import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import {
  createBrandProfile,
  duplicateBrandProfile,
} from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";
import type { UnitOfWork } from "@deck-pack/db";
import type { Transaction } from "@deck-pack/db/transaction";

import type {
  BrandProfileListRow,
  BrandProfileVersionRecord,
  BrandProfileWithVersion,
  CreateBrandProfileResult,
} from "../domain/brand-profile";

export interface BrandProfilesRepository {
  listByUser(userId: string): Promise<BrandProfileListRow[]>;
  getWithVersion(input: {
    userId: string;
    profileId: string;
    versionId?: string;
  }): Promise<BrandProfileWithVersion | null>;
  create(input: {
    userId: string;
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: Record<string, unknown>;
  }): Promise<CreateBrandProfileResult>;
  appendVersion(input: {
    userId: string;
    profileId: string;
    configuration: Record<string, unknown>;
  }): Promise<BrandProfileVersionRecord | null>;
  updateMetadata(input: {
    userId: string;
    profileId: string;
    name?: string;
    description?: string | null;
  }): Promise<void>;
  duplicate(input: {
    userId: string;
    profileId: string;
    name: string;
  }): Promise<CreateBrandProfileResult | null>;
  setDefault(input: {
    userId: string;
    profileId: string;
  }): Promise<{ id: string; isDefault: boolean } | null>;
  archive(input: { userId: string; profileId: string }): Promise<{ id: string } | null>;
}

export class DrizzleBrandProfilesRepository implements BrandProfilesRepository {
  constructor(private readonly uow: UnitOfWork) {}

  private tx(): Transaction {
    return this.uow.getDb() as Transaction;
  }

  async listByUser(userId: string): Promise<BrandProfileListRow[]> {
    const rows = await listBrandProfilesByUser({ tx: this.tx(), userId });
    return rows.map((row) => ({
      ...row,
      configuration: (row.configuration as Record<string, unknown> | null) ?? null,
    }));
  }

  async getWithVersion(input: {
    userId: string;
    profileId: string;
    versionId?: string;
  }): Promise<BrandProfileWithVersion | null> {
    const loaded = await getBrandProfileWithVersion({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
      versionId: input.versionId,
    });
    if (!loaded) return null;
    return {
      profile: loaded.profile,
      version: loaded.version
        ? {
            ...loaded.version,
            configuration: loaded.version.configuration as Record<string, unknown>,
          }
        : null,
    };
  }

  async create(input: {
    userId: string;
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: Record<string, unknown>;
  }): Promise<CreateBrandProfileResult> {
    const created = await createBrandProfile({
      tx: this.tx(),
      input,
    });
    return {
      profile: created.profile,
      version: {
        ...created.version,
        configuration: created.version.configuration as Record<string, unknown>,
      },
    };
  }

  async appendVersion(input: {
    userId: string;
    profileId: string;
    configuration: Record<string, unknown>;
  }): Promise<BrandProfileVersionRecord | null> {
    const version = await createBrandProfileVersion({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
      configuration: input.configuration,
    });
    if (!version) return null;
    return {
      ...version,
      configuration: version.configuration as Record<string, unknown>,
    };
  }

  async updateMetadata(input: {
    userId: string;
    profileId: string;
    name?: string;
    description?: string | null;
  }): Promise<void> {
    await updateBrandProfileMetadata({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
      name: input.name,
      description: input.description,
    });
  }

  async duplicate(input: {
    userId: string;
    profileId: string;
    name: string;
  }): Promise<CreateBrandProfileResult | null> {
    const duplicated = await duplicateBrandProfile({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
      name: input.name,
    });
    if (!duplicated) return null;
    return {
      profile: duplicated.profile,
      version: {
        ...duplicated.version,
        configuration: duplicated.version.configuration as Record<string, unknown>,
      },
    };
  }

  async setDefault(input: {
    userId: string;
    profileId: string;
  }): Promise<{ id: string; isDefault: boolean } | null> {
    return setDefaultBrandProfile({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
    });
  }

  async archive(input: { userId: string; profileId: string }): Promise<{ id: string } | null> {
    return archiveBrandProfile({
      tx: this.tx(),
      profileId: input.profileId,
      userId: input.userId,
    });
  }
}
