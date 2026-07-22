// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssetVariants } from "@/hooks/asset-browser/use-asset-variants";

describe("useAssetVariants", () => {
  it("loads variants for the selected asset", async () => {
    const fetchFn = vi.fn(async () => ({
      variants: [{ id: "variant-1", name: "4:3", imageUrl: "https://example.com/4x3.png" }],
      details: { id: "flag-nl", name: "Netherlands" },
    }));

    const { result } = renderHook(() => useAssetVariants(fetchFn));

    await act(async () => {
      await result.current.loadVariants("flag-nl");
    });

    expect(fetchFn).toHaveBeenCalledWith("flag-nl");
    expect(result.current.variants).toHaveLength(1);
    expect(result.current.details).toEqual({ id: "flag-nl", name: "Netherlands" });
    expect(result.current.error).toBeNull();
  });

  it("maps fetch errors", async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error("Details unavailable");
    });

    const { result } = renderHook(() => useAssetVariants(fetchFn));

    await act(async () => {
      await result.current.loadVariants("flag-nl");
    });

    expect(result.current.error).toBe("Details unavailable");
    expect(result.current.variants).toEqual([]);
    expect(result.current.details).toBeNull();
  });

  it("ignores stale variant responses when selection changes quickly", async () => {
    let resolveFirst:
      | ((value: {
          variants: Array<{ id: string; name: string; imageUrl: string }>;
          details: { id: string };
        }) => void)
      | null = null;
    const firstFetch = new Promise<{
      variants: Array<{ id: string; name: string; imageUrl: string }>;
      details: { id: string };
    }>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(() => firstFetch)
      .mockResolvedValueOnce({
        variants: [{ id: "variant-de", name: "1:1", imageUrl: "https://example.com/de.png" }],
        details: { id: "flag-de" },
      });

    const { result } = renderHook(() => useAssetVariants(fetchFn));

    await act(async () => {
      void result.current.loadVariants("flag-nl");
      await result.current.loadVariants("flag-de");
    });

    expect(result.current.details).toEqual({ id: "flag-de" });

    resolveFirst?.({
      variants: [{ id: "variant-nl", name: "4:3", imageUrl: "https://example.com/nl.png" }],
      details: { id: "flag-nl" },
    });

    await waitFor(() => {
      expect(result.current.details).toEqual({ id: "flag-de" });
    });
  });

  it("resets variant state", async () => {
    const fetchFn = vi.fn(async () => ({
      variants: [{ id: "variant-1", name: "4:3", imageUrl: "https://example.com/4x3.png" }],
      details: { id: "flag-nl" },
    }));

    const { result } = renderHook(() => useAssetVariants(fetchFn));

    await act(async () => {
      await result.current.loadVariants("flag-nl");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.variants).toEqual([]);
    expect(result.current.details).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
