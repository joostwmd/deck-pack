// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePhotoSearch } from "@/hooks/use-photo-search";

const samplePhoto = {
  id: "photo-1",
  name: "Ocean",
  thumbnailUrl: "https://example.com/thumb.jpg",
  insertImageUrl: "https://example.com/large.jpg",
  width: 1000,
  height: 800,
  avgColor: "#112233",
  photoUrl: "https://example.com/photo",
  photographer: "Alex",
  photographerUrl: "https://example.com/alex",
  metadata: {},
};

describe("usePhotoSearch", () => {
  it("searches after submit and stores page-one results", async () => {
    const searchFn = vi.fn(async () => ({
      results: [samplePhoto],
      page: 1,
      perPage: 24,
      totalResults: 1,
      hasNextPage: true,
    }));

    const { result } = renderHook(() => usePhotoSearch(searchFn));

    act(() => {
      result.current.setQueryInput("ocean");
    });
    act(() => {
      result.current.submitSearch();
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
      expect(result.current.results).toHaveLength(1);
    });

    expect(searchFn).toHaveBeenCalledWith({
      query: "ocean",
      page: 1,
      filters: {},
    });
    expect(result.current.hasNextPage).toBe(true);
  });

  it("resets to page one when filters change", async () => {
    const searchFn = vi
      .fn()
      .mockResolvedValueOnce({
        results: [samplePhoto],
        page: 1,
        perPage: 24,
        totalResults: 1,
        hasNextPage: false,
      })
      .mockResolvedValueOnce({
        results: [],
        page: 1,
        perPage: 24,
        totalResults: 0,
        hasNextPage: false,
      });

    const { result } = renderHook(() => usePhotoSearch(searchFn));

    act(() => {
      result.current.setQueryInput("ocean");
    });
    act(() => {
      result.current.submitSearch();
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    act(() => {
      result.current.updateFilters({ orientation: "landscape" });
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenLastCalledWith({
        query: "ocean",
        page: 1,
        filters: { orientation: "landscape" },
      });
    });
  });

  it("appends deduplicated results when loading more", async () => {
    const searchFn = vi
      .fn()
      .mockResolvedValueOnce({
        results: [samplePhoto],
        page: 1,
        perPage: 24,
        totalResults: 2,
        hasNextPage: true,
      })
      .mockResolvedValueOnce({
        results: [samplePhoto, { ...samplePhoto, id: "photo-2", name: "Wave" }],
        page: 2,
        perPage: 24,
        totalResults: 2,
        hasNextPage: false,
      });

    const { result } = renderHook(() => usePhotoSearch(searchFn));

    act(() => {
      result.current.setQueryInput("ocean");
    });
    act(() => {
      result.current.submitSearch();
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.page).toBe(2);
  });
});
