import { afterEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "deck-pack:addin:bearer-token";

function createSessionStorage(): Storage {
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

function setSessionStorage(storage?: Storage): void {
  if (storage) {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: storage,
    });
    return;
  }

  Reflect.deleteProperty(globalThis, "sessionStorage");
}

async function loadBearerStore() {
  vi.resetModules();
  return import("./bearer-session-store");
}

describe("bearer session store", () => {
  afterEach(() => {
    setSessionStorage();
    vi.resetModules();
  });

  it("persists and hydrates the bearer token across module reloads", async () => {
    const storage = createSessionStorage();
    setSessionStorage(storage);
    const firstStore = await loadBearerStore();

    firstStore.setBearerToken("signed.session.token");
    const reloadedStore = await loadBearerStore();

    expect(reloadedStore.getBearerToken()).toBe("signed.session.token");
  });

  it("clears the in-memory and persisted bearer token", async () => {
    const storage = createSessionStorage();
    storage.setItem(STORAGE_KEY, "signed.session.token");
    setSessionStorage(storage);
    const store = await loadBearerStore();

    store.clearBearerToken();
    const reloadedStore = await loadBearerStore();

    expect(store.getBearerToken()).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(reloadedStore.getBearerToken()).toBeNull();
  });

  it("works without browser session storage", async () => {
    setSessionStorage();
    const store = await loadBearerStore();

    expect(() => store.setBearerToken("signed.session.token")).not.toThrow();
    expect(store.getBearerToken()).toBe("signed.session.token");
    expect(() => store.clearBearerToken()).not.toThrow();
    expect(store.getBearerToken()).toBeNull();
  });

  it("tolerates throwing browser session storage", async () => {
    const throwingStorage = createSessionStorage();
    throwingStorage.getItem = () => {
      throw new Error("storage denied");
    };
    throwingStorage.setItem = () => {
      throw new Error("storage denied");
    };
    throwingStorage.removeItem = () => {
      throw new Error("storage denied");
    };
    setSessionStorage(throwingStorage);

    const store = await loadBearerStore();

    expect(() => store.setBearerToken("signed.session.token")).not.toThrow();
    expect(store.getBearerToken()).toBe("signed.session.token");
    expect(() => store.clearBearerToken()).not.toThrow();
    expect(store.getBearerToken()).toBeNull();
  });
});
