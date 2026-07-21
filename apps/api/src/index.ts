import "dotenv/config";

import { initLogging } from "@deck-pack/observability/server";

await initLogging();

const { startServer } = await import("./server.js");
startServer();
