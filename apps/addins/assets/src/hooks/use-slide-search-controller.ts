import { useCallback, useId, useRef } from "react";
import { toast } from "sonner";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useSlideSearch } from "@/hooks/use-slide-search";
import { useResolvedShortcutDef, useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";
import { createInsertionTracker } from "@/lib/track-asset-insertion";
import { insertSlide } from "@/lib/insert-slide";
import { useServices } from "@/services/services-context";

import type { SlideSearchRequest, SlideSearchResponse } from "./types";
import { useSlideSearchHotkeys } from "@/hooks/use-slide-search-hotkeys";

export function useSlideSearchController(
  search: (input: SlideSearchRequest) => Promise<SlideSearchResponse>,
) {
  const { isOfficeAvailable } = useEnvironment();
  const { office, insertions } = useServices();
  const tracker = createInsertionTracker(insertions);
  const flow = useSlideSearch(search);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();
  const focusSearchShortcut = useResolvedShortcutDef("focusSearch");
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();

  const showsResults = !flow.error && flow.results.length > 0;
  const activeResultId =
    showsResults && flow.highlightedSlideId ? flow.highlightedSlideId : undefined;

  const handleInsert = useCallback(async () => {
    const slide = flow.selectedSlide;

    if (!slide) {
      return;
    }

    await runInsertion(async () => {
      await insertSlide(slide, { office, tracker });
      toast.success("Slide inserted");
    }).catch((error) => {
      console.error("Error inserting slide:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting slide");
    });
  }, [flow.selectedSlide, office, runInsertion, tracker]);

  const canInsert = isOfficeAvailable && Boolean(flow.selectedSlide);

  useSlideSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
    canInsert,
  });

  return {
    flow,
    searchInputRef,
    resultsId,
    showsResults,
    activeResultId,
    focusSearchShortcut,
    isInserting,
    handleInsert,
    insertDisabled: !canInsert,
    insertSectionShortcutDefs,
  };
}

export type SlideSearchController = ReturnType<typeof useSlideSearchController>;
