import { useCallback, useRef, useState } from "react";

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
  const requestIdRef = useRef(0);

  const loadVariants = useCallback(
    async (id: string) => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);
      setVariants([]);
      setDetails(null);

      try {
        const result = await fetchFn(id);

        if (requestId !== requestIdRef.current) return;

        setVariants(result.variants);
        setDetails(result.details);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;

        setError(err instanceof Error ? err.message : "Error fetching variants");
        setVariants([]);
        setDetails(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [fetchFn],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
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
