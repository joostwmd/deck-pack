import type {
  BrandProfileListRow,
  BrandProfileRecord,
  BrandProfileVersionRecord,
  BrandProfileWithVersion,
  CreateBrandProfileResult,
} from "../domain/brand-profile";
import type { BrandProfilesRepository } from "./brand-profiles-repository";

type SeedProfile = BrandProfileRecord & {
  versions: BrandProfileVersionRecord[];
};

export type InMemoryBrandProfilesSeed = {
  profiles?: SeedProfile[];
};

export class InMemoryBrandProfilesRepository implements BrandProfilesRepository {
  private profiles = new Map<string, SeedProfile>();

  seed(data: InMemoryBrandProfilesSeed): void {
    for (const profile of data.profiles ?? []) {
      this.profiles.set(profile.id, structuredClone(profile));
    }
  }

  private active(profile: SeedProfile): boolean {
    return profile.archivedAt === null;
  }

  private owned(userId: string, profileId: string): SeedProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile || profile.userId !== userId || !this.active(profile)) return null;
    return profile;
  }

  async listByUser(userId: string): Promise<BrandProfileListRow[]> {
    return [...this.profiles.values()]
      .filter((p) => p.userId === userId && this.active(p))
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })
      .map((p) => {
        const version = p.versions.find((v) => v.id === p.activeVersionId) ?? null;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          isDefault: p.isDefault,
          activeVersionId: p.activeVersionId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          versionNumber: version?.version ?? null,
          schemaVersion: version?.schemaVersion ?? null,
          configuration: version?.configuration ?? null,
        };
      });
  }

  async getWithVersion(input: {
    userId: string;
    profileId: string;
    versionId?: string;
  }): Promise<BrandProfileWithVersion | null> {
    const profile = this.owned(input.userId, input.profileId);
    if (!profile) return null;
    const targetId = input.versionId ?? profile.activeVersionId;
    const version = targetId ? (profile.versions.find((v) => v.id === targetId) ?? null) : null;
    const { archivedAt: _a, ...profileRow } = profile;
    return {
      profile: profileRow,
      version: version ? structuredClone(version) : null,
    };
  }

  async create(input: {
    userId: string;
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: Record<string, unknown>;
  }): Promise<CreateBrandProfileResult> {
    const now = new Date();
    const profileId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    if (input.isDefault) {
      for (const p of this.profiles.values()) {
        if (p.userId === input.userId) p.isDefault = false;
      }
    }

    const version: BrandProfileVersionRecord = {
      id: versionId,
      profileId,
      version: 1,
      schemaVersion: 1,
      configuration: structuredClone(input.configuration),
      createdByUserId: input.userId,
      createdAt: now,
    };

    const profile: SeedProfile = {
      id: profileId,
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      isDefault: input.isDefault ?? false,
      activeVersionId: versionId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      versions: [version],
    };
    this.profiles.set(profileId, profile);
    const { archivedAt: _a, versions: _v, ...profileRow } = profile;
    return { profile: profileRow, version: structuredClone(version) };
  }

  async appendVersion(input: {
    userId: string;
    profileId: string;
    configuration: Record<string, unknown>;
  }): Promise<BrandProfileVersionRecord | null> {
    const profile = this.profiles.get(input.profileId);
    if (!profile || profile.userId !== input.userId) return null;
    const nextVersion = Math.max(0, ...profile.versions.map((v) => v.version)) + 1;
    const version: BrandProfileVersionRecord = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      version: nextVersion,
      schemaVersion: 1,
      configuration: structuredClone(input.configuration),
      createdByUserId: input.userId,
      createdAt: new Date(),
    };
    profile.versions.push(version);
    profile.activeVersionId = version.id;
    profile.updatedAt = new Date();
    return structuredClone(version);
  }

  async updateMetadata(input: {
    userId: string;
    profileId: string;
    name?: string;
    description?: string | null;
  }): Promise<void> {
    const profile = this.owned(input.userId, input.profileId);
    if (!profile) return;
    if (input.name !== undefined) profile.name = input.name;
    if (input.description !== undefined) profile.description = input.description;
    profile.updatedAt = new Date();
  }

  async duplicate(input: {
    userId: string;
    profileId: string;
    name: string;
  }): Promise<CreateBrandProfileResult | null> {
    const existing = this.owned(input.userId, input.profileId);
    if (!existing) return null;
    const active = existing.versions.find((v) => v.id === existing.activeVersionId);
    if (!active) return null;
    return this.create({
      userId: input.userId,
      name: input.name,
      description: existing.description,
      configuration: active.configuration,
    });
  }

  async setDefault(input: {
    userId: string;
    profileId: string;
  }): Promise<{ id: string; isDefault: boolean } | null> {
    const profile = this.owned(input.userId, input.profileId);
    if (!profile) return null;
    for (const p of this.profiles.values()) {
      if (p.userId === input.userId) p.isDefault = false;
    }
    profile.isDefault = true;
    profile.updatedAt = new Date();
    return { id: profile.id, isDefault: true };
  }

  async archive(input: { userId: string; profileId: string }): Promise<{ id: string } | null> {
    const profile = this.owned(input.userId, input.profileId);
    if (!profile) return null;
    profile.archivedAt = new Date();
    profile.isDefault = false;
    profile.updatedAt = new Date();
    return { id: profile.id };
  }
}
