import {
  type AuthenticationResult,
  type IPublicClientApplication,
  InteractionRequiredAuthError,
  createNestablePublicClientApplication,
} from "@azure/msal-browser";

const MICROSOFT_SCOPES = ["openid", "profile", "email", "User.Read"];

let msalInstance: IPublicClientApplication | undefined;

/** Office injects this bridge for Nested App Authentication (not the Windows WAM broker). */
export function isNestedAppAuthBridgePresent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof (window as Window & { nestedAppAuthBridge?: unknown }).nestedAppAuthBridge !==
    "undefined"
  );
}

export async function checkNaaBrokerAvailable(): Promise<boolean> {
  return isNestedAppAuthBridgePresent();
}

export async function initNestableMsal(clientId: string): Promise<IPublicClientApplication> {
  if (!isNestedAppAuthBridgePresent()) {
    throw new Error(
      "NESTED_APP_AUTH_BRIDGE_MISSING — Office did not inject nestedAppAuthBridge into this taskpane. Confirm Entra SPA redirect brk-multihub://localhost:3003, restart Office, or use email OTP.",
    );
  }

  if (!msalInstance) {
    try {
      msalInstance = await createNestablePublicClientApplication({
        auth: {
          clientId,
          authority: "https://login.microsoftonline.com/common",
        },
        cache: {
          cacheLocation: "localStorage",
        },
      });
    } catch (error) {
      throw new Error(`MSAL_INIT_FAILED — ${formatMsalInitError(error)}`);
    }
  }

  return msalInstance;
}

function formatMsalInitError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const serialized = JSON.stringify(error);

    if (
      record.name === "ServerError" &&
      serialized.includes('"errorCode":""') &&
      serialized.includes('"errorMessage":""')
    ) {
      return `${serialized} — Common causes: Entra SPA redirect brk-multihub://<addin-origin> missing on this client ID, or VITE_MICROSOFT_CLIENT_ID does not match API MICROSOFT_CLIENT_ID.`;
    }

    if (serialized && serialized !== "{}") {
      return serialized;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown MSAL initialization error";
  }
}

function shouldRetryMicrosoftSignInInteractively(error: unknown): boolean {
  if (error instanceof InteractionRequiredAuthError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { name?: string; errorCode?: string };

  // Mac NAA often throws ServerError on first sign-in instead of InteractionRequiredAuthError.
  if (record.name === "ServerError") {
    return true;
  }

  return record.errorCode === "no_account_error" || record.errorCode === "no_tokens_found";
}

export async function acquireMicrosoftTokens(clientId: string): Promise<AuthenticationResult> {
  const msal = await initNestableMsal(clientId);

  try {
    return await msal.acquireTokenSilent({ scopes: MICROSOFT_SCOPES });
  } catch (silentError) {
    if (!shouldRetryMicrosoftSignInInteractively(silentError)) {
      throw new Error(`MSAL_SILENT_FAILED — ${formatMsalInitError(silentError)}`);
    }

    try {
      return await msal.acquireTokenPopup({
        scopes: MICROSOFT_SCOPES,
        prompt: "select_account",
      });
    } catch (popupError) {
      throw new Error(`MSAL_POPUP_FAILED — ${formatMsalInitError(popupError)}`);
    }
  }
}
