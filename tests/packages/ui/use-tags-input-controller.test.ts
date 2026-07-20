// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTagsInputController } from "@deck-pack/ui/hooks/use-tags-input-controller";

describe("useTagsInputController", () => {
  it("manages uncontrolled tags and normalizes on change", () => {
    const { result } = renderHook(() =>
      useTagsInputController({
        defaultValue: ["USA"],
        label: "Search terms",
      }),
    );

    expect(result.current.value).toEqual(["USA"]);

    act(() => {
      result.current.onValueChange(["USA", "  United   States  "]);
    });

    expect(result.current.value).toEqual(["USA", "United States"]);
  });

  it("rejects empty, duplicate, and custom-invalid tags", () => {
    const onInvalid = vi.fn();
    const { result } = renderHook(() =>
      useTagsInputController({
        defaultValue: ["USA"],
        onInvalid,
        validate: (tag) => (tag.length < 2 ? "too_short" : true),
      }),
    );

    expect(result.current.onValidate?.("")).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith("", "empty");

    expect(result.current.onValidate?.("usa")).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith("usa", "duplicate");

    expect(result.current.onValidate?.("A")).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith("A", "too_short");

    expect(result.current.onValidate?.("America")).toBe(true);
  });

  it("supports controlled mode and injected suggestTags API", async () => {
    const onValueChange = vi.fn();
    const suggestTags = vi.fn(async (query: string) =>
      query ? [`${query}-suggested`] : [],
    );

    const { result, rerender } = renderHook(
      ({ value }) =>
        useTagsInputController({
          value,
          onValueChange,
          api: { suggestTags },
        }),
      { initialProps: { value: ["one"] } },
    );

    expect(result.current.value).toEqual(["one"]);

    act(() => {
      result.current.onValueChange(["one", "two"]);
    });
    expect(onValueChange).toHaveBeenCalledWith(["one", "two"]);

    rerender({ value: ["one", "two"] });
    expect(result.current.value).toEqual(["one", "two"]);

    await act(async () => {
      await result.current.loadSuggestions("us");
    });
    expect(suggestTags).toHaveBeenCalledWith("us");
    expect(result.current.suggestions).toEqual(["us-suggested"]);
  });
});
