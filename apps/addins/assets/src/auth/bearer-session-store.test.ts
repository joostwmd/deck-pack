import { afterEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "deck-pack:addin:bearer-token";

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

function setGlobal(name: "localStorage" | "sessionStorage" | "Office", value?: unknown): void {
  if (value !== undefined) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
    });
    return;
  }

  Reflect.deleteProperty(globalThis, name);
}

async function loadBearerStore() {
  vi.resetModules();
  return import("./bearer-session-store");
}

describe("bearer session store", () => {
  afterEach(() => {
    setGlobal("localStorage");
    setGlobal("sessionStorage");
    setGlobal("Office");
    vi.resetModules();
  });

  it("persists and hydrates the bearer token across module reloads", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    const firstStore = await loadBearerStore();

    firstStore.setBearerToken("signed.session.token");
    const reloadedStore = await loadBearerStore();

    expect(storage.getItem(STORAGE_KEY)).toBe("signed.session.token");
    expect(reloadedStore.getBearerToken()).toBe("signed.session.token");
  });

  it("namespaces the storage key with the Office partition key", async () => {
    const storage = createMemoryStorage();
    setGlobal("localStorage", storage);
    setGlobal("Office", { context: { partitionKey: "partition-abc" } });
    const store = await loadBearerStore();

    store.setBearerToken("signed.session.token");

    expect(storage.getItem(`partition-abc:${STORAGE_KEY}`)).toBe("signed.session.token");
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(store.getBearerToken()).toBe("signed.session.token");
  });

  it("migrates a legacy sessionStorage token into localStorage", async () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    session.setItem(STORAGE_KEY, "legacy.session.token");
    setGlobal("localStorage", local);
    setGlobal("sessionStorage", session);

    const store = await loadBearerStore();

    expect(store.getBearerToken()).toBe("legacy.session.token");
    expect(local.getItem(STORAGE_KEY)).toBe("legacy.session.token");
    expect(session.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears the in-memory and persisted bearer token", async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, "signed.session.token");
    setGlobal("localStorage", storage);
    const store = await loadBearerStore();

    store.clearBearerToken();
    const reloadedStore = await loadBearerStore();

    expect(store.getBearerToken()).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(reloadedStore.getBearerToken()).toBeNull();
  });

  it("works without browser storage", async () => {
    const store = await loadBearerStore();

    expect(() => store.setBearerToken("signed.session.token")).not.toThrow();
    expect(store.getBearerToken()).toBe("signed.session.token");
    expect(() => store.clearBearerToken()).not.toThrow();
    expect(store.getBearerToken()).toBeNull();
  });

  it("tolerates throwing browser storage", async () => {
    const throwingStorage = createMemoryStorage();
    throwingStorage.getItem = () => {
      throw new Error("storage denied");
    };
    throwingStorage.setItem = () => {
      throw new Error("storage denied");
    };
    throwingStorage.removeItem = () => {
      throw new Error("storage denied");
    };
    setGlobal("localStorage", throwingStorage);

    const store = await loadBearerStore();

    expect(() => store.setBearerToken("signed.session.token")).not.toThrow();
    expect(store.getBearerToken()).toBe("signed.session.token");
    expect(() => store.clearBearerToken()).not.toThrow();
    expect(store.getBearerToken()).toBeNull();
  });
});
