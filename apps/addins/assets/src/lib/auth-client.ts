import { env } from "@deck-pack/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
});
