import { officeClient } from "@deck-pack/office-js";

import type { SlideSearchResult } from "@/features/slides/types";
import { fetchFileAsBase64 } from "@/lib/fetch-file-as-base64";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";

function buildSlideMetadata(slide: SlideSearchResult): Record<string, string> {
  return {
    SLIDE_ID: slide.id,
    CATEGORY: slide.category,
    ASPECT_RATIO: slide.aspectRatio,
    TAGS: slide.tags.join(","),
  };
}

export async function insertSlide(slide: SlideSearchResult) {
  const base64 = await fetchFileAsBase64(slide.presentationUrl);
  await officeClient.insertSlidesFromBase64(base64);

  trackAssetInsertion({
    assetType: "slide",
    externalId: slide.id,
    client: "office",
    metadata: buildSlideMetadata(slide),
  });
}
