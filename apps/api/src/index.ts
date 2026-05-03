import "dotenv/config";

import { initSentry } from "./lib/observability/sentry";
import { initObservability } from "./observability";

initSentry();
await initObservability();

const { startServer } = await import("./server.js");
startServer();
