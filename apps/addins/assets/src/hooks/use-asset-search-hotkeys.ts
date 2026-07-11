import { useHotkeys } from "@tanstack/react-hotkeys";
import type { RefObject } from "react";

import type { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { SHORTCUTS } from "@/lib/shortcuts";

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

  useHotkeys([
    {
      hotkey: SHORTCUTS.focusSearch.hotkey,
      callback: () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      },
      options: {
        meta: { name: SHORTCUTS.focusSearch.id, description: SHORTCUTS.focusSearch.description },
      },
    },
    {
      hotkey: SHORTCUTS.navigateResultsUp.hotkey,
      callback: () => flow.navigateResults("up"),
      options: {
        enabled: inSearchPhase && hasResults,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateResultsUp.id,
          description: SHORTCUTS.navigateResultsUp.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateResultsDown.hotkey,
      callback: () => flow.navigateResults("down"),
      options: {
        enabled: inSearchPhase && hasResults,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateResultsDown.id,
          description: SHORTCUTS.navigateResultsDown.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.selectResult.hotkey,
      callback: () => flow.selectHighlightedResult(),
      options: {
        enabled: inSearchPhase && hasResults,
        ignoreInputs: false,
        meta: { name: SHORTCUTS.selectResult.id, description: SHORTCUTS.selectResult.description },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsUp.hotkey,
      callback: () => flow.navigateVariants("up"),
      options: {
        enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateVariantsUp.id,
          description: SHORTCUTS.navigateVariantsUp.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsDown.hotkey,
      callback: () => flow.navigateVariants("down"),
      options: {
        enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateVariantsDown.id,
          description: SHORTCUTS.navigateVariantsDown.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsLeft.hotkey,
      callback: () => flow.navigateVariants("left"),
      options: {
        enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateVariantsLeft.id,
          description: SHORTCUTS.navigateVariantsLeft.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsRight.hotkey,
      callback: () => flow.navigateVariants("right"),
      options: {
        enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.navigateVariantsRight.id,
          description: SHORTCUTS.navigateVariantsRight.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.selectVariant.hotkey,
      callback: () => flow.confirmHighlightedVariant(),
      options: {
        enabled: inVariantPhase && hasVariants && !flow.isFetchingVariants,
        ignoreInputs: false,
        meta: {
          name: SHORTCUTS.selectVariant.id,
          description: SHORTCUTS.selectVariant.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.insert.hotkey,
      callback: () => void onInsert(),
      options: {
        enabled: canInsert,
        meta: { name: SHORTCUTS.insert.id, description: SHORTCUTS.insert.description },
      },
    },
    {
      hotkey: SHORTCUTS.back.hotkey,
      callback: () => {
        const returnsToSearch = !!flow.selectedEntity && !flow.selectedVariantId;
        flow.goBack();

        if (returnsToSearch) {
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }
      },
      options: {
        enabled: canGoBack,
        meta: { name: SHORTCUTS.back.id, description: SHORTCUTS.back.description },
      },
    },
  ]);
}
