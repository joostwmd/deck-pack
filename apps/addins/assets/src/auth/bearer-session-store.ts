const BASE_STORAGE_KEY = "deck-pack:addin:bearer-token";

/**
 * Office task pane webviews are torn down when the pane closes, so sessionStorage
 * does not survive reopen. Persist the bearer token in localStorage instead,
 * namespaced with Office.context.partitionKey per Microsoft guidance
 * (https://learn.microsoft.com/office/dev/add-ins/develop/persisting-add-in-state-and-settings).
 */
function getPartitionKey(): string | null {
  try {
    const office = (globalThis as { Office?: typeof Office }).Office;
    return office?.context?.partitionKey ?? null;
  } catch {
    return null;
  }
}

/** Resolved lazily: Office.context is not ready when this module is first imported. */
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

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

let bearerToken: string | null = null;
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;

  try {
    const storage = getLocalStorage();
    bearerToken = storage?.getItem(getStorageKey()) ?? null;

    if (bearerToken === null) {
      // Migrate tokens persisted by the previous sessionStorage-based store.
      const legacyToken = getSessionStorage()?.getItem(BASE_STORAGE_KEY) ?? null;
      if (legacyToken) {
        bearerToken = legacyToken;
        storage?.setItem(getStorageKey(), legacyToken);
        getSessionStorage()?.removeItem(BASE_STORAGE_KEY);
      }
    }
  } catch {
    // Keep the in-memory session usable when WebView storage is unavailable.
  }
}

export function getBearerToken(): string | null {
  hydrate();
  return bearerToken;
}

export function setBearerToken(token: string): void {
  hydrated = true;
  bearerToken = token;

  try {
    getLocalStorage()?.setItem(getStorageKey(), token);
  } catch {
    // Keep the in-memory session usable when WebView storage is unavailable.
  }
}

export function clearBearerToken(): void {
  hydrated = true;
  bearerToken = null;

  try {
    const storage = getLocalStorage();
    storage?.removeItem(getStorageKey());
    storage?.removeItem(BASE_STORAGE_KEY);
    getSessionStorage()?.removeItem(BASE_STORAGE_KEY);
  } catch {
    // The in-memory session is still cleared when WebView storage is unavailable.
  }
}
