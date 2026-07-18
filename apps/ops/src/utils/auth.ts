import { createOpsAuthClient } from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

export const authClient = createOpsAuthClient({
  baseURL: env.VITE_SERVER_URL,
});

export function getAuthClient() {
  return authClient;
}
