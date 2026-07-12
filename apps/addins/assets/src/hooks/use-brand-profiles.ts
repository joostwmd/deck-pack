import type { BrandProfileConfiguration } from "@deck-pack/presentation-check";
import { useCallback, useEffect, useState } from "react";

import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";
import { trpcClient } from "@/utils/trpc";

export interface BrandProfileSummary {
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
}

export interface BrandProfileDetail {
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
}

export function useBrandProfiles() {
  const [profiles, setProfiles] = useState<BrandProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await trpcClient.brandProfiles.list.query();
      setProfiles(rows as BrandProfileSummary[]);
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, "Failed to load themes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profiles, loading, error, refresh };
}

export async function fetchBrandProfile(profileId: string): Promise<BrandProfileDetail> {
  return trpcClient.brandProfiles.get.query({ profileId }) as Promise<BrandProfileDetail>;
}

export async function saveBrandProfile(input: {
  profileId?: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  configuration: BrandProfileConfiguration;
}) {
  if (input.profileId) {
    return trpcClient.brandProfiles.update.mutate({
      profileId: input.profileId,
      name: input.name,
      description: input.description,
      configuration: input.configuration,
    });
  }

  return trpcClient.brandProfiles.create.mutate({
    name: input.name,
    description: input.description,
    isDefault: input.isDefault,
    configuration: input.configuration,
  });
}

export async function duplicateBrandProfile(profileId: string, name: string) {
  return trpcClient.brandProfiles.duplicate.mutate({ profileId, name });
}

export async function setDefaultBrandProfile(profileId: string) {
  return trpcClient.brandProfiles.setDefault.mutate({ profileId });
}

export async function archiveBrandProfile(profileId: string) {
  return trpcClient.brandProfiles.archive.mutate({ profileId });
}
