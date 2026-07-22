import type { createRouter } from "@tanstack/react-router";

import type { routeTree } from "./routeTree.gen";

type AppRouter = ReturnType<typeof createRouter<typeof routeTree>>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
