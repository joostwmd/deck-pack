import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";
import type { ObjectStorage } from "@deck-pack/storage";

import { addinRouter } from "../routers/addin-router";
import { agendaRouter } from "../routers/agenda-router";
import { billingRouter } from "../routers/billing-router";
import { brandProfilesRouter } from "../routers/brand-profiles-router";
import { flagsRouter } from "../routers/flags-router";
import { galleryRouter } from "../routers/gallery-router";
import { iconsRouter } from "../routers/icons-router";
import { logosRouter } from "../routers/logos-router";
import { membersRouter } from "../routers/members-router";
import { organizationRouter } from "../routers/organization-router";
import { photosRouter } from "../routers/photos-router";
import { seatsRouter } from "../routers/seats-router";
import { shapesRouter } from "../routers/shapes-router";
import { shortcutsRouter } from "../routers/shortcuts-router";
import { slidesRouter } from "../routers/slides-router";
import { systemRouter } from "../routers/system-router";
import { usageRouter } from "../routers/usage-router";
import { usersRouter } from "../routers/users-router";
import { AppContainer } from "../container";

import { router } from "./init";

export type AddinRouterDeps = {
  brandfetchApiKey: string;
  brandfetchClientId: string;
  nounProjectApiKey: string;
  nounProjectApiSecret: string;
  pexelsApiKey: string;
  pexels?: PexelsClient;
  nounProject?: NounProjectClient;
  brandfetch?: BrandfetchClient;
  storage?: ObjectStorage;
};

export function createAppRouter(_deps: AddinRouterDeps, container: AppContainer) {
  return router({
    ...systemRouter,
    organization: organizationRouter(container),
    members: membersRouter(container),
    seats: seatsRouter(container),
    usage: usageRouter(container),
    users: usersRouter(container),
    billing: billingRouter(container),
    gallery: galleryRouter(container),
    assets: router({
      photos: photosRouter(container),
      slides: slidesRouter(container),
      shapes: shapesRouter(container),
      icons: iconsRouter(container),
      logos: logosRouter(container),
      flags: flagsRouter(container),
    }),
    addin: addinRouter(container),
    agenda: agendaRouter(container),
    brandProfiles: brandProfilesRouter(container),
    shortcuts: shortcutsRouter(container),
  });
}

export const appRouter = createAppRouter(
  {
    brandfetchApiKey: "dummy-key-for-now",
    brandfetchClientId: "dummy-client-id-for-now",
    nounProjectApiKey: "dummy-key-for-now",
    nounProjectApiSecret: "dummy-secret-for-now",
    pexelsApiKey: "dummy-key-for-now",
  },
  AppContainer.forUnitTest(),
);

export type AppRouter = typeof appRouter;
