import { useCallback, useState } from "react";

import { addinApi } from "@/lib/api";

import type { LogoListItem } from "./use-logo-search";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useLogoVariants() {
  const [variants, setVariants] = useState<LogoListItem[]>([]);
  const [logoDetails, setLogoDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVariants = useCallback(async (brandId: string) => {
    setIsLoading(true);
    setError(null);
    setVariants([]);
    setLogoDetails(null);

    try {
      const details = await addinApi.getLogoDetails(brandId);
      setLogoDetails(details);

      const mapped = (details.logos || []).map((logo: any, index: number) => ({
        id: `${index}`,
        imageUrl: logo.formats?.[0]?.src || "",
        name: `${capitalize(logo.type)} - ${capitalize(logo.theme)}`,
      }));

      setVariants(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching logo variants");
      setVariants([]);
      setLogoDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVariants([]);
    setLogoDetails(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    variants,
    logoDetails,
    isLoading,
    error,
    loadVariants,
    reset,
  };
}
