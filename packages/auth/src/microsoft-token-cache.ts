import { initNestableMsal, resetNestableMsalInstance } from "./microsoft-naa";

export interface MicrosoftTokenCache {
  clear(clientId: string): Promise<void>;
}

export class MsalNestableTokenCache implements MicrosoftTokenCache {
  async clear(clientId: string): Promise<void> {
    try {
      const msal = await initNestableMsal(clientId);

      if (typeof msal.clearCache === "function") {
        await msal.clearCache();
      }
    } catch {
      // Continuity opt-out is the hard guarantee; cache clear is best-effort under NAA.
    } finally {
      resetNestableMsalInstance();
    }
  }
}
