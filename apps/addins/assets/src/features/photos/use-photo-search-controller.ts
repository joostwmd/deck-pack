import { useCallback, useId, useRef } from "react";
import { toast } from "sonner";

import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { useResolvedShortcutDef, useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";

import type { PhotoSearchRequest, PhotoSearchResponse } from "./types";
import { usePhotoSearch } from "./use-photo-search";
import { usePhotoSearchHotkeys } from "./use-photo-search-hotkeys";

export function usePhotoSearchController(
  search: (input: PhotoSearchRequest) => Promise<PhotoSearchResponse>,
) {
  const flow = usePhotoSearch(search);
  const insertionStrategy = useInsertionStrategy();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();
  const focusSearchShortcut = useResolvedShortcutDef("focusSearch");
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();

  const showsResults = !flow.error && flow.results.length > 0;
  const activeResultId =
    showsResults && flow.highlightedPhotoId ? flow.highlightedPhotoId : undefined;

  const handleInsert = useCallback(async () => {
    const photo = flow.selectedPhoto;

    if (!photo || !insertionStrategy) {
      return;
    }

    await runInsertion(async () => {
      await insertionStrategy.insert({
        variantId: photo.id,
        name: photo.name,
        imageUrl: photo.insertImageUrl,
        insert: {
          type: "image",
          imageUrl: photo.insertImageUrl,
        },
        metadata: photo.metadata,
        assetType: "photo",
        externalId: photo.id,
      });

      toast.success(
        insertionStrategy.verb === "Insert" ? "Photo inserted" : "Photo added to canvas",
      );
    }).catch((error) => {
      console.error("Error inserting photo:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting photo");
    });
  }, [flow.selectedPhoto, insertionStrategy, runInsertion]);

  usePhotoSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
  });

  const insertLabel = insertionStrategy?.verb ?? "Insert";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return {
    flow,
    searchInputRef,
    resultsId,
    showsResults,
    activeResultId,
    focusSearchShortcut,
    isInserting,
    handleInsert,
    insertLabel,
    insertingLabel,
    insertDisabled: !flow.selectedPhoto || !insertionStrategy,
    insertSectionShortcutDefs,
  };
}

export type PhotoSearchController = ReturnType<typeof usePhotoSearchController>;
