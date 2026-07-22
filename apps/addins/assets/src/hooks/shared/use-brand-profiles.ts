export type { BrandProfileDetail, BrandProfileSummary } from "@deck-pack/hooks/brand-profiles";
export {
  archiveBrandProfile,
  duplicateBrandProfile,
  fetchBrandProfile,
  saveBrandProfile,
  setDefaultBrandProfile,
  useBrandProfiles as useBrandProfilesQuery,
} from "@deck-pack/hooks/brand-profiles";

import { useBrandProfiles as useBrandProfilesQuery } from "@deck-pack/hooks/brand-profiles";

import { getUserFacingApiErrorMessage } from "@/utils/user-facing-api-error";
import { useServices } from "@/services/services-context";

export function useBrandProfiles() {
  const { brandProfiles } = useServices();
  const query = useBrandProfilesQuery(brandProfiles);

  return {
    profiles: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? getUserFacingApiErrorMessage(query.error, "Failed to load themes") : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}
