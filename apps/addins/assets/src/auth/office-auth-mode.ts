import { isOfficeDocumentAvailable } from "@deck-pack/office-js";

/** Set before the app bundle imports auth/trpc clients (see main.tsx bootstrap). */
let officeBearerMode: boolean | null = null;

export function setOfficeBearerMode(enabled: boolean): void {
  officeBearerMode = enabled;
}

/** Whether Office taskpane auth should use in-memory bearer tokens. */
export function useOfficeBearerMode(): boolean {
  if (officeBearerMode !== null) {
    return officeBearerMode;
  }

  return isOfficeDocumentAvailable();
}
