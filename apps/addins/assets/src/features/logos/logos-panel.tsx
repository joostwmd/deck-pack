import { officeClient } from "@deck-pack/office-js";
import { ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LogoEmptyState } from "@/components/logos/logo-empty-state";
import { LogoInsertButton } from "@/components/logos/logo-insert-button";
import { LogoScreenHeader } from "@/components/logos/logo-screen-header";
import { LogoSearchBar } from "@/components/logos/logo-search-bar";
import { LogoSearchResults } from "@/components/logos/logo-search-results";
import { LogoVariantGrid } from "@/components/logos/logo-variant-grid";
import { SelectedBrandHeader } from "@/components/logos/selected-brand-header";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLogoSearch } from "@/hooks/use-logo-search";
import { useLogoVariants } from "@/hooks/use-logo-variants";
import { urlToBase64 } from "@/lib/url-to-base64";

type LogosPanelMode = "office" | "web";

interface LogosPanelProps {
  mode: LogosPanelMode;
}

export function LogosPanel({ mode }: LogosPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const debouncedQuery = useDebouncedValue(searchValue, 500);

  const { results, isSearching, hasSearched, error: searchError } = useLogoSearch(debouncedQuery);
  const { variants, logoDetails, isLoading: isFetchingVariants, error: variantsError, loadVariants, reset } =
    useLogoVariants();

  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  useEffect(() => {
    if (searchError) {
      toast.error("Error searching for logos");
    }
  }, [searchError]);

  useEffect(() => {
    if (variantsError) {
      toast.error("Error fetching logo variants");
    }
  }, [variantsError]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;

    setSelectedEntity(null);
    setSelectedVariantId(null);
    reset();
  }, [debouncedQuery, reset]);

  async function handleSelectEntity(id: string) {
    const entity = results.find((result) => result.id === id);
    if (!entity) return;

    setSelectedEntity({
      id: entity.id,
      name: entity.name,
      icon: entity.imageUrl,
    });
    setSelectedVariantId(null);
    await loadVariants(id);
  }

  function handleSelectVariant(id: string) {
    setSelectedVariantId(id);
  }

  async function handleInsert() {
    if (!selectedEntity || !selectedVariantId || !logoDetails) return;

    if (mode === "web") {
      toast.info("Canvas coming soon", {
        description: "Logo will be addable to the slide canvas in a future update.",
      });
      return;
    }

    setIsInserting(true);

    try {
      const variantIndex = Number.parseInt(selectedVariantId, 10);
      const logo = logoDetails.logos?.[variantIndex];
      const logoUrl = logo?.formats?.[0]?.src;

      if (!logoUrl) {
        toast.error("No logo URL found");
        return;
      }

      const logoBase64 = await urlToBase64(logoUrl);

      await officeClient.insertImageWithMetadata(logoBase64, {
        TYPE: "logo",
        BRAND_ID: selectedEntity.id,
        BRAND_NAME: logoDetails.name || "",
        STOCK_TICKERS: logoDetails.company?.financialIdentifiers?.ticker?.join(",") || "",
      });

      toast.success("Logo inserted");
    } catch (error) {
      console.error("Error inserting logo:", error);
      toast.error("Error inserting logo");
    } finally {
      setIsInserting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <LogoScreenHeader
        title="Logos"
        text="Search and insert brand logos into your presentation."
      />

      <div className="px-4 pt-4">
        <LogoSearchBar
          value={searchValue}
          onChange={setSearchValue}
          isSearching={isSearching}
          placeholder="Search logos..."
        />
      </div>

      <div className="mt-4 flex flex-1 flex-col px-4 pb-4">
        {results.length > 0 ? (
          <LogoSearchResults
            results={results}
            selectedId={selectedEntity?.id}
            onSelect={(id) => void handleSelectEntity(id)}
          />
        ) : hasSearched && !isSearching ? (
          <LogoEmptyState
            icon={ImageIcon}
            title="No logos found"
            description="Try searching for a different brand or company name."
          />
        ) : null}

        {selectedEntity ? (
          <div className="mt-4 border-t pt-4">
            <SelectedBrandHeader entity={selectedEntity} />

            <div className="mt-4">
              {isFetchingVariants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              ) : variants.length > 0 ? (
                <LogoVariantGrid
                  variants={variants}
                  selectedId={selectedVariantId}
                  onSelect={handleSelectVariant}
                />
              ) : (
                <LogoEmptyState
                  icon={ImageIcon}
                  title="No variants available"
                  description="This brand has no logo variants."
                />
              )}
            </div>

            <LogoInsertButton
              disabled={!selectedVariantId}
              isInserting={isInserting}
              label={mode === "web" ? "Add to canvas" : "Insert"}
              insertingLabel={mode === "web" ? "Adding..." : "Inserting..."}
              onClick={handleInsert}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
