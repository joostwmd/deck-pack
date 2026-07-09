import { useCallback, useState } from "react";

import type { AssetListItem } from "@/lib/asset-types";

export interface AssetVariantsResult<TDetails = any> {
  variants: AssetListItem[];
  details: TDetails | null;
}

export function useAssetVariants<TDetails = any>(
  fetchFn: (id: string) => Promise<AssetVariantsResult<TDetails>>,
) {
  const [variants, setVariants] = useState<AssetListItem[]>([]);
  const [details, setDetails] = useState<TDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVariants = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      setVariants([]);
      setDetails(null);

      try {
        const result = await fetchFn(id);
        setVariants(result.variants);
        setDetails(result.details);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching variants");
        setVariants([]);
        setDetails(null);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFn],
  );

  const reset = useCallback(() => {
    setVariants([]);
    setDetails(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    variants,
    details,
    isLoading,
    error,
    loadVariants,
    reset,
  };
}
