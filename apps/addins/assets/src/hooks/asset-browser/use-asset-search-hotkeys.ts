import type { RefObject } from "react";

import { useShortcutCommands } from "@/hooks/shortcuts/use-shortcut-commands";
import type { useAssetSearchFlow } from "@/hooks/asset-browser/use-asset-search-flow";

type AssetSearchFlow = ReturnType<typeof useAssetSearchFlow>;

interface UseAssetSearchHotkeysOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  flow: AssetSearchFlow;
  onInsert: () => void | Promise<void>;
  isInserting: boolean;
}

export function useAssetSearchHotkeys({
  searchInputRef,
  flow,
  onInsert,
  isInserting,
}: UseAssetSearchHotkeysOptions) {
  const inSearchPhase = !flow.selectedEntity;
  const inVariantPhase = !!flow.selectedEntity;
  const hasResults = flow.results.length > 0;
  const hasVariants = flow.variants.length > 0;
  const canInsert = !!flow.selectedEntity && !!flow.selectedVariantId && !isInserting;
  const canGoBack = !!flow.searchValue || !!flow.selectedEntity || !!flow.selectedVariantId;

  useShortcutCommands([
    {
      id: "focusSearch",
      execute: () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      },
    },
    {
      id: "navigateResultsUp",
      execute: () => flow.navigateResults("up"),
      enabled: inSearchPhase && hasResults,
    },
    {
      id: "navigateResultsDown",
      execute: () => flow.navigateResults("down"),
      enabled: inSearchPhase && hasResults,
    },
    {
      id: "selectResult",
      execute: () => flow.selectHighlightedResult(),
      enabled: inSearchPhase && hasResults,
    },
    {
      id: "navigateVariantsUp",
      execute: () => flow.navigateVariants("up"),
      enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
    },
    {
      id: "navigateVariantsDown",
      execute: () => flow.navigateVariants("down"),
      enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
    },
    {
      id: "navigateVariantsLeft",
      execute: () => flow.navigateVariants("left"),
      enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
    },
    {
      id: "navigateVariantsRight",
      execute: () => flow.navigateVariants("right"),
      enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
    },
    {
      id: "selectVariant",
      execute: () => flow.confirmHighlightedVariant(),
      enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
    },
    {
      id: "insert",
      execute: () => void onInsert(),
      enabled: canInsert,
    },
    {
      id: "back",
      execute: () => {
        const returnsToSearch = !!flow.selectedEntity && !flow.selectedVariantId;
        flow.goBack();

        if (returnsToSearch) {
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }
      },
      enabled: canGoBack,
    },
  ]);
}
