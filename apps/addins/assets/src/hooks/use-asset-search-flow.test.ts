// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { mockFlagDetails, mockFlagSearch } from "@/testing/fixtures/asset-search";

describe("useAssetSearchFlow", () => {
  it("accepts injected search and getDetails functions", async () => {
    const search = vi.fn(async () => []);
    const getDetails = vi.fn(mockFlagDetails);

    const { result } = renderHook(() => useAssetSearchFlow({ search, getDetails }));

    act(() => {
      result.current.setSearchValue("nether");
    });

    expect(typeof result.current.setSearchValue).toBe("function");
    expect(result.current.results).toEqual([]);
  });
});
