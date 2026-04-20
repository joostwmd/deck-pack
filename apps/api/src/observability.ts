import { configure, getConsoleSink } from "@logtape/logtape";

/**
 * Configure LogTape once before the HTTP server handles traffic.
 * Add file / Sentry sinks here when you wire production observability.
 */
export async function initObservability() {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ["deck-pack"],
        lowestLevel: "debug",
        sinks: ["console"],
      },
      {
        category: ["deck-pack", "request"],
        lowestLevel: "debug",
        sinks: ["console"],
      },
      {
        category: ["deck-pack", "http"],
        lowestLevel: "info",
        sinks: ["console"],
      },
      {
        category: ["deck-pack", "api", "trpc"],
        lowestLevel: "debug",
        sinks: ["console"],
      },
    ],
  });
}
