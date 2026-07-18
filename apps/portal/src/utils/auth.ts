import { createAuthClient } from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
});
