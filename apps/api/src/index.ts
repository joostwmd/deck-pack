import { initObservability } from "./observability";
import { startServer } from "./server";

await initObservability();
startServer();
