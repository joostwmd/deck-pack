import { beforeEach, describe, expect, it, vi } from "vitest";

const { insertSlidesFromBase64, fetchFileAsBase64, track } = vi.hoisted(() => ({
  insertSlidesFromBase64: vi.fn(),
  fetchFileAsBase64: vi.fn(),
  track: vi.fn(),
}));

vi.mock("@/lib/fetch-file-as-base64", () => ({
  fetchFileAsBase64,
}));

import { insertSlide } from "./insert-slide";

const slide = {
  id: "slide-title-hero",
  name: "Title Hero",
  thumbnailUrl: "/mock-slides/thumbnails/title-hero.svg",
  presentationUrl: "/mock-slides/title-hero.pptx",
  category: "Intro",
  tags: ["title", "cover"],
  aspectRatio: "16:9" as const,
  createdAt: "2026-01-15T10:00:00.000Z",
};

const deps = {
  office: { insertSlidesFromBase64 },
  tracker: { track },
};

describe("insertSlide", () => {
  beforeEach(() => {
    insertSlidesFromBase64.mockReset();
    fetchFileAsBase64.mockReset();
    track.mockReset();
    fetchFileAsBase64.mockResolvedValue("UEsDBA==");
    insertSlidesFromBase64.mockResolvedValue(undefined);
  });

  it("fetches the presentation, inserts it, and tracks the event", async () => {
    await insertSlide(slide, deps);

    expect(fetchFileAsBase64).toHaveBeenCalledWith("/mock-slides/title-hero.pptx");
    expect(insertSlidesFromBase64).toHaveBeenCalledWith("UEsDBA==");
    expect(track).toHaveBeenCalledWith({
      assetType: "slide",
      externalId: "slide-title-hero",
      client: "office",
      metadata: {
        SLIDE_ID: "slide-title-hero",
        CATEGORY: "Intro",
        ASPECT_RATIO: "16:9",
        TAGS: "title,cover",
      },
    });
  });

  it("propagates fetch failures", async () => {
    fetchFileAsBase64.mockRejectedValue(new Error("Failed to fetch file (500)"));

    await expect(insertSlide(slide, deps)).rejects.toThrow("Failed to fetch file (500)");
    expect(insertSlidesFromBase64).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
