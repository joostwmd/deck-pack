import type { BrandProfileConfiguration } from "@deck-pack/brand-compliance";

export type BrandProfileSummary = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  versionNumber: number | null;
  schemaVersion: number | null;
  configuration: BrandProfileConfiguration | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BrandProfileDetail = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: {
    id: string;
    version: number;
    schemaVersion: number;
    configuration: BrandProfileConfiguration;
    createdAt: Date;
  } | null;
};

export interface BrandProfileStore {
  list: () => Promise<BrandProfileSummary[]>;
  get: (profileId: string, versionId?: string) => Promise<BrandProfileDetail>;
  create: (input: {
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: BrandProfileConfiguration;
  }) => Promise<BrandProfileDetail>;
  update: (input: {
    profileId: string;
    name?: string;
    description?: string | null;
    configuration: BrandProfileConfiguration;
  }) => Promise<BrandProfileDetail>;
  duplicate: (input: { profileId: string; name: string }) => Promise<BrandProfileDetail>;
  setDefault: (profileId: string) => Promise<{ id: string; isDefault: boolean }>;
  archive: (profileId: string) => Promise<{ id: string }>;
}

/** Duck-typed surface of `trpc.brandProfiles`. */
export type BrandProfilesTrpcApi = {
  list: { query: () => Promise<BrandProfileSummary[]> };
  get: { query: (input: unknown) => Promise<BrandProfileDetail> };
  create: { mutate: (input: unknown) => Promise<BrandProfileDetail> };
  update: { mutate: (input: unknown) => Promise<BrandProfileDetail> };
  duplicate: { mutate: (input: unknown) => Promise<BrandProfileDetail> };
  setDefault: { mutate: (input: unknown) => Promise<{ id: string; isDefault: boolean }> };
  archive: { mutate: (input: unknown) => Promise<{ id: string }> };
};

export function createTrpcBrandProfilesStore(api: BrandProfilesTrpcApi): BrandProfileStore {
  return {
    list: () => api.list.query(),
    get: (profileId, versionId) => api.get.query({ profileId, versionId }),
    create: (input) => api.create.mutate(input),
    update: (input) => api.update.mutate(input),
    duplicate: (input) => api.duplicate.mutate(input),
    setDefault: (profileId) => api.setDefault.mutate({ profileId }),
    archive: (profileId) => api.archive.mutate({ profileId }),
  };
}
