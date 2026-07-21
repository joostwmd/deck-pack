import type { BrandProfileConfiguration } from "@deck-pack/presentation-check";
import { useCallback, useEffect, useState } from "react";

import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";
import { useServices } from "@/services/services-context";
import type { BrandProfileDetail, BrandProfileStore, BrandProfileSummary } from "@/services/types";

export type { BrandProfileDetail, BrandProfileSummary };

export function useBrandProfiles() {
  const { brandProfiles } = useServices();
  const [profiles, setProfiles] = useState<BrandProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await brandProfiles.list();
      setProfiles(rows);
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, "Failed to load themes"));
    } finally {
      setLoading(false);
    }
  }, [brandProfiles]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profiles, loading, error, refresh };
}

export async function fetchBrandProfile(
  brandProfiles: BrandProfileStore,
  profileId: string,
): Promise<BrandProfileDetail> {
  return brandProfiles.get(profileId);
}

export async function saveBrandProfile(
  brandProfiles: BrandProfileStore,
  input: {
    profileId?: string;
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: BrandProfileConfiguration;
  },
) {
  if (input.profileId) {
    return brandProfiles.update({
      profileId: input.profileId,
      name: input.name,
      description: input.description,
      configuration: input.configuration,
    });
  }

  return brandProfiles.create({
    name: input.name,
    description: input.description,
    isDefault: input.isDefault,
    configuration: input.configuration,
  });
}

export async function duplicateBrandProfile(
  brandProfiles: BrandProfileStore,
  profileId: string,
  name: string,
) {
  return brandProfiles.duplicate({ profileId, name });
}

export async function setDefaultBrandProfile(brandProfiles: BrandProfileStore, profileId: string) {
  return brandProfiles.setDefault(profileId);
}

export async function archiveBrandProfile(brandProfiles: BrandProfileStore, profileId: string) {
  return brandProfiles.archive(profileId);
}
