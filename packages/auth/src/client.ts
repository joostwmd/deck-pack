import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * Browser client for Vite / React. Uses `better-auth/react` so `useSession` is a real hook.
 * The vanilla `better-auth/client` build exposes session as a Nano Store atom, not a React hook.
 */
export function createAuthClient(config: { baseURL: string }) {
  return createReactAuthClient({
    baseURL: config.baseURL,
    plugins: [emailOTPClient()],
  });
}
