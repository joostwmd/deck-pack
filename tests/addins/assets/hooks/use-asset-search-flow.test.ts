// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { mockFlagDetails, mockFlagSearch } from "@fixtures/asset-search";

describe("useAssetSearchFlow", () => {
  it("runs injected search after debounced input changes", async () => {
    const search = vi.fn(mockFlagSearch);
    const getDetails = vi.fn(mockFlagDetails);

    const { result } = renderHook(() => useAssetSearchFlow({ search, getDetails }));

    act(() => {
      result.current.setSearchValue("nether");
    });

    await waitFor(
      () => {
        expect(search).toHaveBeenCalledWith("nether");
      },
      { timeout: 2000 },
    );

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });
  });

  it("loads variants after selecting an entity", async () => {
    const search = vi.fn(async () => [
      { id: "flag-nl", name: "Netherlands", imageUrl: "https://example.com/nl.png" },
    ]);
    const getDetails = vi.fn(mockFlagDetails);

    const { result } = renderHook(() => useAssetSearchFlow({ search, getDetails }));

    act(() => {
      result.current.setSearchValue("nether");
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    await act(async () => {
      await result.current.selectEntity("flag-nl");
    });

    await waitFor(() => {
      expect(getDetails).toHaveBeenCalledWith("flag-nl");
      expect(result.current.variants.length).toBeGreaterThan(0);
    });
  });
});
