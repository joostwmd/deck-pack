import { describe, expect, it, vi } from "vitest";

import { fetchFileAsBase64 } from "@/lib/fetch-file-as-base64";

describe("fetchFileAsBase64", () => {
  it("returns raw base64 without a data URL prefix", async () => {
    const payload = new Uint8Array([72, 101, 108, 108, 111]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => payload.buffer,
      }),
    );

    await expect(fetchFileAsBase64("https://example.com/file.pptx")).resolves.toBe("SGVsbG8=");

    vi.unstubAllGlobals();
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(fetchFileAsBase64("https://example.com/missing.pptx")).rejects.toThrow(
      "Failed to fetch file (404)",
    );

    vi.unstubAllGlobals();
  });
});
