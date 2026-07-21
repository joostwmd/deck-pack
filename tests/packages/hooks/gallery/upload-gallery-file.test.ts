import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadGalleryFile } from "@deck-pack/hooks/gallery/upload-gallery-file";
import type { GalleryStore, UploadTarget } from "@deck-pack/hooks/gallery";

function createFile(content: string, name = "test.svg", type = "image/svg+xml"): File {
  return new File([content], name, { type });
}

function createFakeStore(target: UploadTarget): GalleryStore & {
  calls: {
    createUploadTarget: unknown[];
    finalizeUpload: unknown[];
    putAndFinalize: unknown[];
  };
} {
  const calls = {
    createUploadTarget: [] as unknown[],
    finalizeUpload: [] as unknown[],
    putAndFinalize: [] as unknown[],
  };

  return {
    calls,
    list: async () => [],
    get: async () => {
      throw new Error("not implemented");
    },
    create: async () => ({ id: "item_1" }),
    update: async () => {
      throw new Error("not implemented");
    },
    publish: async () => {
      throw new Error("not implemented");
    },
    unpublish: async () => {
      throw new Error("not implemented");
    },
    archive: async () => {
      throw new Error("not implemented");
    },
    createUploadTarget: async (input) => {
      calls.createUploadTarget.push(input);
      return target;
    },
    finalizeUpload: async (input) => {
      calls.finalizeUpload.push(input);
      return {} as Awaited<ReturnType<GalleryStore["finalizeUpload"]>>;
    },
    putAndFinalize: async (input) => {
      calls.putAndFinalize.push(input);
      return {} as Awaited<ReturnType<GalleryStore["putAndFinalize"]>>;
    },
  };
}

describe("uploadGalleryFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses putAndFinalize when target mode is proxy", async () => {
    const target: UploadTarget = {
      key: "global/shape/item_1/svg.svg",
      uploadUrl: "memory://upload/global%2Fshape%2Fitem_1%2Fsvg.svg",
      method: "PUT",
      headers: { "Content-Type": "image/svg+xml" },
      expiresAt: new Date("2026-01-01T00:15:00.000Z"),
      mode: "proxy",
    };
    const gallery = createFakeStore(target);
    const file = createFile("<svg/>");
    const progress: number[] = [];

    await uploadGalleryFile({
      gallery,
      itemId: "item_1",
      role: "svg",
      file,
      onProgress: (value) => progress.push(value),
    });

    expect(gallery.calls.createUploadTarget).toHaveLength(1);
    expect(gallery.calls.putAndFinalize).toHaveLength(1);
    expect(gallery.calls.finalizeUpload).toHaveLength(0);

    const putCall = gallery.calls.putAndFinalize[0] as {
      id: string;
      role: string;
      key: string;
      contentType: string;
      dataBase64: string;
    };
    expect(putCall.id).toBe("item_1");
    expect(putCall.role).toBe("svg");
    expect(putCall.key).toBe(target.key);
    expect(putCall.contentType).toBe("image/svg+xml");
    expect(Buffer.from(putCall.dataBase64, "base64").toString("utf8")).toBe("<svg/>");
    expect(progress).toContain(100);
  });

  it("uses fetch and finalizeUpload when target mode is direct", async () => {
    const target: UploadTarget = {
      key: "global/shape/item_1/svg.svg",
      uploadUrl: "https://storage.example/upload",
      method: "PUT",
      headers: { "Content-Type": "image/svg+xml", "x-ms-blob-type": "BlockBlob" },
      expiresAt: new Date("2026-01-01T00:15:00.000Z"),
      mode: "direct",
    };
    const gallery = createFakeStore(target);
    const file = createFile("<svg/>");

    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await uploadGalleryFile({
      gallery,
      itemId: "item_1",
      role: "svg",
      file,
      onProgress: () => undefined,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(target.uploadUrl);
    expect(gallery.calls.putAndFinalize).toHaveLength(0);
    expect(gallery.calls.finalizeUpload).toHaveLength(1);

    const finalizeCall = gallery.calls.finalizeUpload[0] as {
      id: string;
      role: string;
      key: string;
      contentType: string;
    };
    expect(finalizeCall.id).toBe("item_1");
    expect(finalizeCall.key).toBe(target.key);
    expect(finalizeCall.contentType).toBe("image/svg+xml");
  });

  it("throws on direct upload fetch failure without finalizing", async () => {
    const target: UploadTarget = {
      key: "global/shape/item_1/svg.svg",
      uploadUrl: "https://storage.example/upload",
      method: "PUT",
      headers: { "Content-Type": "image/svg+xml" },
      expiresAt: new Date("2026-01-01T00:15:00.000Z"),
      mode: "direct",
    };
    const gallery = createFakeStore(target);
    const file = createFile("<svg/>");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403 })),
    );

    await expect(
      uploadGalleryFile({
        gallery,
        itemId: "item_1",
        role: "svg",
        file,
        onProgress: () => undefined,
      }),
    ).rejects.toThrow("Upload failed (403)");

    expect(gallery.calls.finalizeUpload).toHaveLength(0);
    expect(gallery.calls.putAndFinalize).toHaveLength(0);
  });
});
