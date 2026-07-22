import { and, desc, eq, isNull } from "drizzle-orm";

import type { UnitOfWork } from "@deck-pack/db";
import { brandProfileVersions, brandProfiles } from "@deck-pack/db/schema/brand-profiles";

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

  async listByUser(userId: string): Promise<BrandProfileListRow[]> {
    const db = this.uow.getDb();
    const rows = await db
      .select({
        id: brandProfiles.id,
        name: brandProfiles.name,
        description: brandProfiles.description,
        isDefault: brandProfiles.isDefault,
        activeVersionId: brandProfiles.activeVersionId,
        createdAt: brandProfiles.createdAt,
        updatedAt: brandProfiles.updatedAt,
        versionNumber: brandProfileVersions.version,
        schemaVersion: brandProfileVersions.schemaVersion,
        configuration: brandProfileVersions.configuration,
      })
      .from(brandProfiles)
      .leftJoin(brandProfileVersions, eq(brandProfiles.activeVersionId, brandProfileVersions.id))
      .where(and(eq(brandProfiles.userId, userId), isNull(brandProfiles.archivedAt)))
      .orderBy(desc(brandProfiles.isDefault), desc(brandProfiles.updatedAt));

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
    const db = this.uow.getDb();
    const [profile] = await db
      .select({
        id: brandProfiles.id,
        userId: brandProfiles.userId,
        name: brandProfiles.name,
        description: brandProfiles.description,
        isDefault: brandProfiles.isDefault,
        activeVersionId: brandProfiles.activeVersionId,
        createdAt: brandProfiles.createdAt,
        updatedAt: brandProfiles.updatedAt,
      })
      .from(brandProfiles)
      .where(
        and(
          eq(brandProfiles.id, input.profileId),
          eq(brandProfiles.userId, input.userId),
          isNull(brandProfiles.archivedAt),
        ),
      )
      .limit(1);

    if (!profile) {
      return null;
    }

    const targetVersionId = input.versionId ?? profile.activeVersionId;
    if (!targetVersionId) {
      return { profile, version: null };
    }

    const [version] = await db
      .select({
        id: brandProfileVersions.id,
        profileId: brandProfileVersions.profileId,
        version: brandProfileVersions.version,
        schemaVersion: brandProfileVersions.schemaVersion,
        configuration: brandProfileVersions.configuration,
        createdByUserId: brandProfileVersions.createdByUserId,
        createdAt: brandProfileVersions.createdAt,
      })
      .from(brandProfileVersions)
      .where(
        and(
          eq(brandProfileVersions.id, targetVersionId),
          eq(brandProfileVersions.profileId, input.profileId),
        ),
      )
      .limit(1);

    return {
      profile,
      version: version
        ? {
            ...version,
            configuration: version.configuration as Record<string, unknown>,
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
    return this.uow.withTransaction(async () => {
      const db = this.uow.getDb();

      if (input.isDefault) {
        await db
          .update(brandProfiles)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(brandProfiles.userId, input.userId));
      }

      const [profile] = await db
        .insert(brandProfiles)
        .values({
          userId: input.userId,
          name: input.name,
          description: input.description ?? null,
          isDefault: input.isDefault ?? false,
        })
        .returning({
          id: brandProfiles.id,
          userId: brandProfiles.userId,
          name: brandProfiles.name,
          description: brandProfiles.description,
          isDefault: brandProfiles.isDefault,
          activeVersionId: brandProfiles.activeVersionId,
          createdAt: brandProfiles.createdAt,
          updatedAt: brandProfiles.updatedAt,
        });

      const [version] = await db
        .insert(brandProfileVersions)
        .values({
          profileId: profile!.id,
          version: 1,
          schemaVersion: 1,
          configuration: input.configuration,
          createdByUserId: input.userId,
        })
        .returning({
          id: brandProfileVersions.id,
          profileId: brandProfileVersions.profileId,
          version: brandProfileVersions.version,
          schemaVersion: brandProfileVersions.schemaVersion,
          configuration: brandProfileVersions.configuration,
          createdByUserId: brandProfileVersions.createdByUserId,
          createdAt: brandProfileVersions.createdAt,
        });

      const [updatedProfile] = await db
        .update(brandProfiles)
        .set({ activeVersionId: version!.id, updatedAt: new Date() })
        .where(eq(brandProfiles.id, profile!.id))
        .returning({
          id: brandProfiles.id,
          userId: brandProfiles.userId,
          name: brandProfiles.name,
          description: brandProfiles.description,
          isDefault: brandProfiles.isDefault,
          activeVersionId: brandProfiles.activeVersionId,
          createdAt: brandProfiles.createdAt,
          updatedAt: brandProfiles.updatedAt,
        });

      return {
        profile: updatedProfile!,
        version: {
          ...version!,
          configuration: version!.configuration as Record<string, unknown>,
        },
      };
    });
  }

  async appendVersion(input: {
    userId: string;
    profileId: string;
    configuration: Record<string, unknown>;
  }): Promise<BrandProfileVersionRecord | null> {
    return this.uow.withTransaction(async () => {
      const db = this.uow.getDb();
      const [profile] = await db
        .select({ id: brandProfiles.id })
        .from(brandProfiles)
        .where(and(eq(brandProfiles.id, input.profileId), eq(brandProfiles.userId, input.userId)))
        .limit(1);

      if (!profile) {
        return null;
      }

      const [latest] = await db
        .select({ version: brandProfileVersions.version })
        .from(brandProfileVersions)
        .where(eq(brandProfileVersions.profileId, input.profileId))
        .orderBy(desc(brandProfileVersions.version))
        .limit(1);

      const nextVersion = (latest?.version ?? 0) + 1;

      const [version] = await db
        .insert(brandProfileVersions)
        .values({
          profileId: input.profileId,
          version: nextVersion,
          schemaVersion: 1,
          configuration: input.configuration,
          createdByUserId: input.userId,
        })
        .returning({
          id: brandProfileVersions.id,
          profileId: brandProfileVersions.profileId,
          version: brandProfileVersions.version,
          schemaVersion: brandProfileVersions.schemaVersion,
          configuration: brandProfileVersions.configuration,
          createdByUserId: brandProfileVersions.createdByUserId,
          createdAt: brandProfileVersions.createdAt,
        });

      await db
        .update(brandProfiles)
        .set({ activeVersionId: version!.id, updatedAt: new Date() })
        .where(eq(brandProfiles.id, input.profileId));

      return {
        ...version!,
        configuration: version!.configuration as Record<string, unknown>,
      };
    });
  }

  async updateMetadata(input: {
    userId: string;
    profileId: string;
    name?: string;
    description?: string | null;
  }): Promise<void> {
    const db = this.uow.getDb();
    await db
      .update(brandProfiles)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(brandProfiles.id, input.profileId), eq(brandProfiles.userId, input.userId)));
  }

  async duplicate(input: {
    userId: string;
    profileId: string;
    name: string;
  }): Promise<CreateBrandProfileResult | null> {
    const db = this.uow.getDb();
    const existing = await db
      .select({
        profile: brandProfiles,
        version: brandProfileVersions,
      })
      .from(brandProfiles)
      .innerJoin(brandProfileVersions, eq(brandProfiles.activeVersionId, brandProfileVersions.id))
      .where(and(eq(brandProfiles.id, input.profileId), eq(brandProfiles.userId, input.userId)))
      .limit(1);

    const row = existing[0];
    if (!row) {
      return null;
    }

    return this.create({
      userId: input.userId,
      name: input.name,
      description: row.profile.description,
      configuration: row.version.configuration as Record<string, unknown>,
    });
  }

  async setDefault(input: {
    userId: string;
    profileId: string;
  }): Promise<{ id: string; isDefault: boolean } | null> {
    return this.uow.withTransaction(async () => {
      const db = this.uow.getDb();
      const [profile] = await db
        .select({ id: brandProfiles.id })
        .from(brandProfiles)
        .where(and(eq(brandProfiles.id, input.profileId), eq(brandProfiles.userId, input.userId)))
        .limit(1);

      if (!profile) {
        return null;
      }

      await db
        .update(brandProfiles)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(brandProfiles.userId, input.userId));

      const [updated] = await db
        .update(brandProfiles)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(brandProfiles.id, input.profileId))
        .returning({
          id: brandProfiles.id,
          isDefault: brandProfiles.isDefault,
        });

      return updated ?? null;
    });
  }

  async archive(input: { userId: string; profileId: string }): Promise<{ id: string } | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .update(brandProfiles)
      .set({
        archivedAt: new Date(),
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(and(eq(brandProfiles.id, input.profileId), eq(brandProfiles.userId, input.userId)))
      .returning({ id: brandProfiles.id });

    return row ?? null;
  }
}
