const STORAGE_KEY = "deck-pack:addin:bearer-token";

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function readPersistedBearerToken(): string | null {
  try {
    return getSessionStorage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

let bearerToken: string | null = readPersistedBearerToken();

export function getBearerToken(): string | null {
  return bearerToken;
}

export function setBearerToken(token: string): void {
  bearerToken = token;

  try {
    getSessionStorage()?.setItem(STORAGE_KEY, token);
  } catch {
    // Keep the in-memory session usable when WebView storage is unavailable.
  }
}

export function clearBearerToken(): void {
  bearerToken = null;

  try {
    getSessionStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // The in-memory session is still cleared when WebView storage is unavailable.
  }
}
