import { router } from "./setup";
import { systemRoutes } from "../domains/system/routes";

export const appRouter = router({
  ...systemRoutes,
});

export type AppRouter = typeof appRouter;
