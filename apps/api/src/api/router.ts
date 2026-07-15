import { BrandfetchClient } from "@deck-pack/brandfetch";
import { Icons8Client } from "@deck-pack/icons8";
import { PexelsClient } from "@deck-pack/pexels";

import { createAddinRoutes } from "../domains/addin/routes";
import { createAddinAssetService } from "../domains/addin/service";
import { agendaRoutes } from "../domains/agenda/routes";
import { brandProfileRoutes } from "../domains/brand-profiles/routes";
import { organizationRoutes } from "../domains/organization/routes";
import { shortcutRoutes } from "../domains/shortcuts/routes";
import { systemRoutes } from "../domains/system/routes";

import { router } from "./setup";

export type AddinRouterDeps = {
  brandfetchApiKey: string;
  icons8ApiKey: string;
  pexelsApiKey: string;
};

export function createAppRouter(deps: AddinRouterDeps) {
  const addinAssetService = createAddinAssetService({
    brandfetch: new BrandfetchClient(deps.brandfetchApiKey),
    icons8: new Icons8Client(deps.icons8ApiKey),
    pexels: new PexelsClient(deps.pexelsApiKey),
  });

  return router({
    ...systemRoutes,
    organization: router(organizationRoutes),
    addin: router(createAddinRoutes(addinAssetService)),
    agenda: router(agendaRoutes),
    brandProfiles: router(brandProfileRoutes),
    shortcuts: router(shortcutRoutes),
  });
}

export const appRouter = createAppRouter({
  brandfetchApiKey: "dummy-key-for-now",
  icons8ApiKey: "dummy-key-for-now",
  pexelsApiKey: "dummy-key-for-now",
});

export type AppRouter = typeof appRouter;
