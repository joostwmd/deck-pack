import {
  ALLOW_SILENT_RESTORE,
  type SessionContinuity,
} from "@deck-pack/auth/microsoft-sign-in";

const BASE_STORAGE_KEY = "deck-pack:addin:session-continuity";

function getPartitionKey(): string | null {
  try {
    const office = (globalThis as { Office?: typeof Office }).Office;
    return office?.context?.partitionKey ?? null;
  } catch {
    return null;
  }
}

function getStorageKey(): string {
  const partitionKey = getPartitionKey();
  return partitionKey ? `${partitionKey}:${BASE_STORAGE_KEY}` : BASE_STORAGE_KEY;
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

let cachedContinuity: SessionContinuity | null = null;
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;

  try {
    const raw = getLocalStorage()?.getItem(getStorageKey());
    if (raw === "require-explicit-sign-in") {
      cachedContinuity = { mode: "require-explicit-sign-in" };
      return;
    }

    if (raw === "allow-silent-restore") {
      cachedContinuity = ALLOW_SILENT_RESTORE;
      return;
    }

    cachedContinuity = ALLOW_SILENT_RESTORE;
  } catch {
    cachedContinuity = ALLOW_SILENT_RESTORE;
  }
}

function serializeContinuity(next: SessionContinuity): string {
  return next.mode;
}

export function getSessionContinuity(): SessionContinuity {
  hydrate();
  return cachedContinuity ?? ALLOW_SILENT_RESTORE;
}

export function setSessionContinuity(next: SessionContinuity): void {
  hydrated = true;
  cachedContinuity = next;

  try {
    getLocalStorage()?.setItem(getStorageKey(), serializeContinuity(next));
  } catch {
    // Keep in-memory continuity when WebView storage is unavailable.
  }
}

export function clearSessionContinuityStorage(): void {
  hydrated = true;
  cachedContinuity = ALLOW_SILENT_RESTORE;

  try {
    const storage = getLocalStorage();
    storage?.removeItem(getStorageKey());
    storage?.removeItem(BASE_STORAGE_KEY);
  } catch {
    // In-memory default still applies.
  }
}

/** Test-only reset for module-level cache. */
export function resetSessionContinuityStoreForTests(): void {
  cachedContinuity = null;
  hydrated = false;
}

export const sessionContinuityStore = {
  get: getSessionContinuity,
  set: setSessionContinuity,
};
