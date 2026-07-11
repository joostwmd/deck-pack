import { BrandfetchClient } from "@deck-pack/brandfetch";
import { Icons8Client } from "@deck-pack/icons8";

import { createAddinRoutes } from "../domains/addin/routes";
import { createAddinAssetService } from "../domains/addin/service";
import { organizationRoutes } from "../domains/organization/routes";
import { systemRoutes } from "../domains/system/routes";

import { router } from "./setup";

export type AddinRouterDeps = {
  brandfetchApiKey: string;
  icons8ApiKey: string;
};

export function createAppRouter(deps: AddinRouterDeps) {
  const addinAssetService = createAddinAssetService({
    brandfetch: new BrandfetchClient(deps.brandfetchApiKey),
    icons8: new Icons8Client(deps.icons8ApiKey),
  });

  return router({
    ...systemRoutes,
    organization: router(organizationRoutes),
    addin: router(createAddinRoutes(addinAssetService)),
  });
}

export const appRouter = createAppRouter({
  brandfetchApiKey: "dummy-key-for-now",
  icons8ApiKey: "dummy-key-for-now",
});

export type AppRouter = typeof appRouter;
