// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFileUploaderController } from "@deck-pack/ui/hooks/use-file-uploader-controller";

function createFile(name: string, size = 128, type = "image/png"): File {
  const contents = new Uint8Array(size);
  return new File([contents], name, { type, lastModified: 1 });
}

describe("useFileUploaderController", () => {
  it("exposes controlled file state and default multiple uploads", () => {
    const uploadFile = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useFileUploaderController({
        uploadFile,
        accept: "image/png",
        maxFiles: 5,
        maxSize: 1024,
      }),
    );

    expect(result.current.value).toEqual([]);
    expect(result.current.multiple).toBe(true);
    expect(result.current.accept).toBe("image/png");
    expect(result.current.maxFiles).toBe(5);
    expect(result.current.maxSize).toBe(1024);

    const next = [createFile("a.png")];
    act(() => {
      result.current.onValueChange(next);
    });
    expect(result.current.value).toEqual(next);
  });

  it("uploads each file, reports progress, and marks success", async () => {
    const uploadFile = vi.fn(async (_file, { onProgress }) => {
      onProgress(50);
      onProgress(100);
    });
    const onProgress = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useFileUploaderController({ uploadFile }));

    const fileA = createFile("a.png");
    const fileB = createFile("b.png");

    await act(async () => {
      await result.current.onUpload([fileA, fileB], {
        onProgress,
        onSuccess,
        onError,
      });
    });

    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith(fileA, 50);
    expect(onProgress).toHaveBeenCalledWith(fileA, 100);
    expect(onSuccess).toHaveBeenCalledWith(fileA);
    expect(onSuccess).toHaveBeenCalledWith(fileB);
    expect(onError).not.toHaveBeenCalled();
  });

  it("clamps progress into 0–100", async () => {
    const uploadFile = vi.fn(async (_file, { onProgress }) => {
      onProgress(-20);
      onProgress(140);
    });
    const onProgress = vi.fn();

    const { result } = renderHook(() => useFileUploaderController({ uploadFile }));
    const file = createFile("a.png");

    await act(async () => {
      await result.current.onUpload([file], {
        onProgress,
        onSuccess: vi.fn(),
        onError: vi.fn(),
      });
    });

    expect(onProgress).toHaveBeenCalledWith(file, 0);
    expect(onProgress).toHaveBeenCalledWith(file, 100);
  });

  it("maps upload failures to onError without failing sibling files", async () => {
    const uploadFile = vi.fn(async (file: File) => {
      if (file.name === "bad.png") {
        throw new Error("boom");
      }
    });
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useFileUploaderController({ uploadFile }));
    const good = createFile("good.png");
    const bad = createFile("bad.png");

    await act(async () => {
      await result.current.onUpload([good, bad], {
        onProgress: vi.fn(),
        onSuccess,
        onError,
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(good);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    expect(onError.mock.calls[0]?.[0]).toBe(bad);
    expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0]?.[1].message).toBe("boom");
  });

  it("wraps non-Error throwables", async () => {
    const uploadFile = vi.fn(async () => {
      throw "nope";
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useFileUploaderController({ uploadFile }));
    const file = createFile("a.png");

    await act(async () => {
      await result.current.onUpload([file], {
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      });
    });

    expect(onError.mock.calls[0]?.[1].message).toBe("Upload failed");
  });
});
