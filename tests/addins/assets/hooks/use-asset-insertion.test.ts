// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssetInsertion } from "@/hooks/asset-browser/use-asset-insertion";

describe("useAssetInsertion", () => {
  it("runs the insertion action and toggles isInserting", async () => {
    let resolveInsert: (() => void) | undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInsert = resolve;
        }),
    );

    const { result } = renderHook(() => useAssetInsertion());

    let pending: Promise<boolean> | undefined;
    act(() => {
      pending = result.current.runInsertion(action);
    });

    expect(result.current.isInserting).toBe(true);

    await act(async () => {
      resolveInsert?.();
      await pending;
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isInserting).toBe(false);
  });

  it("ignores concurrent insertion attempts", async () => {
    let resolveInsert: (() => void) | undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInsert = resolve;
        }),
    );

    const { result } = renderHook(() => useAssetInsertion());

    let first: Promise<boolean> | undefined;
    let second: Promise<boolean> | undefined;

    act(() => {
      first = result.current.runInsertion(action);
      second = result.current.runInsertion(action);
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInsert?.();
      await first;
      await second;
    });

    expect(await second).toBe(false);
  });
});
