import { honoLogger } from "@logtape/hono";

/** Structured HTTP request logging (LogTape). Runs after CORS / security. */
export const requestLoggingMiddleware = honoLogger({
  category: ["deck-pack", "http"],
});
