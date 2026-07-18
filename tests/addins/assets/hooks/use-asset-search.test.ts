// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssetSearch } from "@/hooks/use-asset-search";

describe("useAssetSearch", () => {
  it("calls searchFn and stores results for non-empty queries", async () => {
    const searchFn = vi.fn(async () => [
      { id: "flag-nl", name: "Netherlands", imageUrl: "https://example.com/nl.png" },
    ]);

    const { result } = renderHook(({ query, search }) => useAssetSearch(query, search), {
      initialProps: { query: "nether", search: searchFn },
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(searchFn).toHaveBeenCalledWith("nether");
    expect(result.current.results).toHaveLength(1);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("clears state for empty queries", async () => {
    const searchFn = vi.fn(async () => []);

    const { result, rerender } = renderHook(({ query, search }) => useAssetSearch(query, search), {
      initialProps: { query: "nether", search: searchFn },
    });

    await waitFor(() => {
      expect(result.current.hasSearched).toBe(true);
    });

    rerender({ query: "", search: searchFn });

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("maps search errors and supports retry", async () => {
    const searchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce([
        { id: "flag-nl", name: "Netherlands", imageUrl: "https://example.com/nl.png" },
      ]);

    const { result } = renderHook(({ query, search }) => useAssetSearch(query, search), {
      initialProps: { query: "nether", search: searchFn },
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Network down");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  it("ignores stale responses when the query changes quickly", async () => {
    let resolveFirst: ((value: Array<{ id: string; name: string; imageUrl: string }>) => void) | null =
      null;
    const firstSearch = new Promise<Array<{ id: string; name: string; imageUrl: string }>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    const searchFn = vi
      .fn()
      .mockImplementationOnce(() => firstSearch)
      .mockResolvedValueOnce([
        { id: "flag-de", name: "Germany", imageUrl: "https://example.com/de.png" },
      ]);

    const { result, rerender } = renderHook(({ query, search }) => useAssetSearch(query, search), {
      initialProps: { query: "nether", search: searchFn },
    });

    rerender({ query: "germany", search: searchFn });

    await waitFor(() => {
      expect(result.current.results[0]?.id).toBe("flag-de");
    });

    resolveFirst?.([
      { id: "flag-nl", name: "Netherlands", imageUrl: "https://example.com/nl.png" },
    ]);

    await waitFor(() => {
      expect(result.current.results[0]?.id).toBe("flag-de");
    });
  });
});
