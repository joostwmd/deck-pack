import type { BrandProfileConfiguration } from "@deck-pack/brand-compliance";

import type { BrandProfileDetail, BrandProfileStore } from "./brand-profiles-store";

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
