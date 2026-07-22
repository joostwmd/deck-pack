import { useQuery } from "@tanstack/react-query";

import type { BrandProfileStore } from "./brand-profiles-store";
import { brandProfileKeys } from "./query-keys";

export function useBrandProfiles(brandProfiles: BrandProfileStore) {
  return useQuery({
    queryKey: brandProfileKeys.list(),
    queryFn: () => brandProfiles.list(),
  });
}
