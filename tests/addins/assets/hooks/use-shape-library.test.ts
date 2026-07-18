// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useShapeLibrary } from "@/hooks/use-shape-library";

const sampleShape = {
  id: "shape-1",
  name: "Arrow",
  thumbnailUrl: "https://example.com/shape.png",
  svgUrl: "https://example.com/shape.svg",
  category: "Arrows",
};

describe("useShapeLibrary", () => {
  it("loads shapes on mount", async () => {
    const searchFn = vi.fn(async () => ({
      results: [sampleShape],
      total: 1,
      facets: { categories: ["Arrows", "Flowchart"] },
    }));

    const { result } = renderHook(() => useShapeLibrary(searchFn));

    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.results).toHaveLength(1);
    });

    expect(searchFn).toHaveBeenCalledWith({ category: undefined });
    expect(result.current.facets.categories).toContain("Arrows");
  });

  it("reloads when category changes", async () => {
    const searchFn = vi
      .fn()
      .mockResolvedValueOnce({
        results: [sampleShape],
        total: 1,
        facets: { categories: ["Arrows", "Flowchart"] },
      })
      .mockResolvedValueOnce({
        results: [sampleShape],
        total: 1,
        facets: { categories: ["Arrows"] },
      });

    const { result } = renderHook(() => useShapeLibrary(searchFn));

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    act(() => {
      result.current.updateCategory("Arrows");
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenLastCalledWith({ category: "Arrows" });
    });
  });

  it("maps fetch errors and supports retry", async () => {
    const searchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Shape service down"))
      .mockResolvedValueOnce({
        results: [sampleShape],
        total: 1,
        facets: { categories: ["Arrows"] },
      });

    const { result } = renderHook(() => useShapeLibrary(searchFn));

    await waitFor(() => {
      expect(result.current.error).toBe("Shape service down");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
  });
});
