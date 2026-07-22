import { beforeEach, describe, expect, it, vi } from "vitest";

const clearCache = vi.fn().mockResolvedValue(undefined);
const initNestableMsal = vi.fn().mockResolvedValue({ clearCache });
const resetNestableMsalInstance = vi.fn();

vi.mock("@deck-pack/auth/microsoft-naa", () => ({
  initNestableMsal: (...args: unknown[]) => initNestableMsal(...args),
  resetNestableMsalInstance: () => resetNestableMsalInstance(),
}));

import { MsalNestableTokenCache } from "@deck-pack/auth/microsoft-sign-in";

describe("MsalNestableTokenCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initNestableMsal.mockResolvedValue({ clearCache });
    clearCache.mockResolvedValue(undefined);
  });

  it("clears the MSAL cache and resets the singleton", async () => {
    const cache = new MsalNestableTokenCache();

    await cache.clear("client-id");

    expect(initNestableMsal).toHaveBeenCalledWith("client-id");
    expect(clearCache).toHaveBeenCalledTimes(1);
    expect(resetNestableMsalInstance).toHaveBeenCalledTimes(1);
  });

  it("still resets the singleton when clearCache throws", async () => {
    clearCache.mockRejectedValueOnce(new Error("NAA unsupported"));
    const cache = new MsalNestableTokenCache();

    await cache.clear("client-id");

    expect(resetNestableMsalInstance).toHaveBeenCalledTimes(1);
  });

  it("still resets the singleton when MSAL init fails", async () => {
    initNestableMsal.mockRejectedValueOnce(new Error("bridge missing"));
    const cache = new MsalNestableTokenCache();

    await cache.clear("client-id");

    expect(resetNestableMsalInstance).toHaveBeenCalledTimes(1);
  });

  it("skips clearCache when the method is unavailable", async () => {
    initNestableMsal.mockResolvedValueOnce({});
    const cache = new MsalNestableTokenCache();

    await cache.clear("client-id");

    expect(clearCache).not.toHaveBeenCalled();
    expect(resetNestableMsalInstance).toHaveBeenCalledTimes(1);
  });
});
