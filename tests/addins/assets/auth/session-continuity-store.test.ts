import { afterEach, describe, expect, it, vi } from "vitest";

import { ALLOW_SILENT_RESTORE, REQUIRE_EXPLICIT_SIGN_IN } from "@deck-pack/auth/microsoft-sign-in";

const STORAGE_KEY = "deck-pack:addin:session-continuity";

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    getItem(key) {
      return entries.get(key) ?? null;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    removeItem(key) {
      entries.delete(key);
    },
    setItem(key, value) {
      entries.set(key, value);
    },
  };
}

function setGlobal(name: "localStorage" | "Office", value?: unknown): void {
  if (value !== undefined) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
    });
    return;
  }

  Reflect.deleteProperty(globalThis, name);
}

async function loadContinuityStore() {
  vi.resetModules();
  return import("@/auth/session-continuity-store");
}

describe("session continuity store", () => {
  afterEach(() => {
    setGlobal("localStorage");
    setGlobal("Office");
    vi.resetModules();
  });

  it("defaults to allow-silent-restore when unset", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    const store = await loadContinuityStore();

    expect(store.getSessionContinuity()).toEqual(ALLOW_SILENT_RESTORE);
  });

  it("persists require-explicit-sign-in across module reloads", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    const firstStore = await loadContinuityStore();

    firstStore.setSessionContinuity(REQUIRE_EXPLICIT_SIGN_IN);
    const reloadedStore = await loadContinuityStore();

    expect(storage.getItem(STORAGE_KEY)).toBe("require-explicit-sign-in");
    expect(reloadedStore.getSessionContinuity()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);
  });

  it("namespaces the storage key with the Office partition key", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    setGlobal("Office", { context: { partitionKey: "partition-abc" } });
    const store = await loadContinuityStore();

    store.setSessionContinuity(REQUIRE_EXPLICIT_SIGN_IN);

    expect(storage.getItem(`partition-abc:${STORAGE_KEY}`)).toBe("require-explicit-sign-in");
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears storage back to allow-silent-restore default", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    const store = await loadContinuityStore();

    store.setSessionContinuity(REQUIRE_EXPLICIT_SIGN_IN);
    store.clearSessionContinuityStorage();

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(store.getSessionContinuity()).toEqual(ALLOW_SILENT_RESTORE);
  });
});
