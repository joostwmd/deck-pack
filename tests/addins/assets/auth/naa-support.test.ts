import { describe, expect, it, vi } from "vitest";

import { isNaaSupported } from "@/auth/naa-support";

describe("isNaaSupported", () => {
  it("returns false when Office is unavailable", () => {
    vi.stubGlobal("window", {
      Office: undefined,
    } as unknown as Window & typeof globalThis);

    expect(isNaaSupported()).toBe(false);
  });

  it("returns true when NestedAppAuth 1.1 is supported", () => {
    vi.stubGlobal("window", {
      Office: {
        context: {
          requirements: {
            isSetSupported: (set: string, version: string) =>
              set === "NestedAppAuth" && version === "1.1",
          },
        },
      },
    } as unknown as Window & typeof globalThis);

    expect(isNaaSupported()).toBe(true);
  });
});
