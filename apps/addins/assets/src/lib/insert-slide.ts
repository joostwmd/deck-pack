import type { SlideSearchResult } from "@/components/slides/types";
import { fetchFileAsBase64 } from "@/lib/fetch-file-as-base64";
import type { InsertionTracker, OfficeService } from "@/services/types";

function buildSlideMetadata(slide: SlideSearchResult): Record<string, string> {
  return {
    SLIDE_ID: slide.id,
    CATEGORY: slide.category,
    ASPECT_RATIO: slide.aspectRatio,
    TAGS: slide.tags.join(","),
  };
}

export async function insertSlide(
  slide: SlideSearchResult,
  deps: {
    office: Pick<OfficeService, "insertSlidesFromBase64">;
    tracker: InsertionTracker;
  },
) {
  const base64 = await fetchFileAsBase64(slide.presentationUrl);
  await deps.office.insertSlidesFromBase64(base64);

  deps.tracker.track({
    assetType: "slide",
    externalId: slide.id,
    client: "office",
    metadata: buildSlideMetadata(slide),
  });
}
