import { describe, expect, it, vi } from "vitest";

vi.mock("@deck-pack/env/server", () => ({
  env: { NODE_ENV: "development" },
}));

import { uploadTargetForClient } from "@deck-pack/api/domains/library/upload-target-for-client";

describe("uploadTargetForClient", () => {
  const directTarget = {
    key: "global/shape/item_1/svg.svg",
    uploadUrl: "https://example.blob.core.windows.net/images/key?sas=token",
    method: "PUT" as const,
    headers: { "Content-Type": "image/svg+xml" },
    expiresAt: new Date("2026-01-01T00:15:00.000Z"),
    mode: "direct" as const,
  };

  it("forces proxy mode in development for direct targets", () => {
    expect(uploadTargetForClient(directTarget).mode).toBe("proxy");
  });

  it("leaves proxy targets unchanged", () => {
    const proxyTarget = { ...directTarget, mode: "proxy" as const };
    expect(uploadTargetForClient(proxyTarget)).toEqual(proxyTarget);
  });
});
