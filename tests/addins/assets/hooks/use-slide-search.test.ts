// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSlideSearch } from "@/hooks/slides/use-slide-search";

const sampleSlide = {
  id: "slide-1",
  name: "Agenda",
  thumbnailUrl: "https://example.com/slide.png",
  presentationUrl: "https://example.com/slide.pptx",
  category: "Agenda",
  tags: ["outline"],
  aspectRatio: "16:9" as const,
  createdAt: "2024-01-01",
};

describe("useSlideSearch", () => {
  it("loads slides on mount and applies debounced query changes", async () => {
    const searchFn = vi.fn(async () => ({
      results: [sampleSlide],
      total: 1,
      facets: {
        categories: ["Agenda"],
        tags: ["outline"],
        aspectRatios: ["16:9" as const],
      },
    }));

    const { result } = renderHook(() => useSlideSearch(searchFn));

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    expect(searchFn).toHaveBeenCalledWith({
      query: undefined,
      filters: {},
      sort: "relevance",
    });

    act(() => {
      result.current.setQueryInput("agenda");
    });

    await waitFor(
      () => {
        expect(searchFn).toHaveBeenLastCalledWith({
          query: "agenda",
          filters: {},
          sort: "relevance",
        });
      },
      { timeout: 2000 },
    );
  });

  it("updates sort and filter driven searches", async () => {
    const searchFn = vi.fn(async () => ({
      results: [sampleSlide],
      total: 1,
      facets: {
        categories: ["Agenda"],
        tags: ["outline"],
        aspectRatios: ["16:9" as const],
      },
    }));

    const { result } = renderHook(() => useSlideSearch(searchFn));

    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
    });

    act(() => {
      result.current.updateSort("newest");
      result.current.updateFilters({ category: "Agenda" });
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenLastCalledWith({
        query: undefined,
        filters: { category: "Agenda" },
        sort: "newest",
      });
    });

    expect(result.current.activeFilterCount).toBe(1);
  });
});
