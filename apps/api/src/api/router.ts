import { router } from "./setup";
import { organizationRoutes } from "../domains/organization/routes";
import { systemRoutes } from "../domains/system/routes";

export const appRouter = router({
  ...systemRoutes,
  organization: router(organizationRoutes),
});

export type AppRouter = typeof appRouter;
