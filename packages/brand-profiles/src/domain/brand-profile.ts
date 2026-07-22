export type BrandProfileRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type BrandProfileVersionRecord = {
  id: string;
  profileId: string;
  version: number;
  schemaVersion: number;
  configuration: Record<string, unknown>;
  createdByUserId: string | null;
  createdAt: Date;
};

export type BrandProfileListRow = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  versionNumber: number | null;
  schemaVersion: number | null;
  configuration: Record<string, unknown> | null;
};

export type BrandProfileWithVersion = {
  profile: Omit<BrandProfileRecord, "archivedAt">;
  version: BrandProfileVersionRecord | null;
};

export type CreateBrandProfileResult = {
  profile: Omit<BrandProfileRecord, "archivedAt">;
  version: BrandProfileVersionRecord;
};
