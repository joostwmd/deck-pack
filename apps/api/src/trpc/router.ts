import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import { assertInsertAllowed } from "@deck-pack/db/queries/usage-entitlements";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";

import { createAddinRoutes } from "../domains/addin/routes";
import { createAddinService } from "../domains/addin/service";
import { createAgendaRoutes } from "../domains/agenda/routes";
import { createAgendaService } from "../domains/agenda/service";
import { billingRouter } from "../routers/billing-router";
import { brandProfilesRouter } from "../routers/brand-profiles-router";
import { flagsRouter } from "../routers/flags-router";
import { galleryRouter } from "../routers/gallery-router";
import { iconsRouter } from "../routers/icons-router";
import { logosRouter } from "../routers/logos-router";
import { membersRouter } from "../routers/members-router";
import { organizationRouter } from "../routers/organization-router";
import { photosRouter } from "../routers/photos-router";
import { shapesRouter } from "../routers/shapes-router";
import { slidesRouter } from "../routers/slides-router";
import { usersRouter } from "../routers/users-router";
import { seatsRouter } from "../routers/seats-router";
import { usageRouter } from "../routers/usage-router";
import { AppContainer } from "../container";
import { createShortcutRoutes } from "../domains/shortcuts/routes";
import { createShortcutService } from "../domains/shortcuts/service";
import { systemRoutes } from "../domains/system/routes";
import type { ObjectStorage } from "@deck-pack/storage";

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
  const addinService = createAddinService({ insertAssetInsertion, assertInsertAllowed });

  const agendaService = createAgendaService({
    syncAgenda,
    getAgendaInstance,
  });

  const shortcutService = createShortcutService({
    listAllShortcutOverridesByUser,
    upsertShortcutOverride,
    deleteShortcutOverride,
    deleteAllShortcutOverrides,
  });

  return router({
    ...systemRoutes,
    organization: organizationRouter(container),
    members: membersRouter(container),
    seats: seatsRouter(container),
    usage: usageRouter(container),
    users: usersRouter(container),
    billing: billingRouter(container),
    library: galleryRouter(container),
    assets: router({
      photos: photosRouter(container),
      slides: slidesRouter(container),
      shapes: shapesRouter(container),
      icons: iconsRouter(container),
      logos: logosRouter(container),
      flags: flagsRouter(container),
    }),
    addin: router(createAddinRoutes(addinService)),
    agenda: router(createAgendaRoutes(agendaService)),
    brandProfiles: brandProfilesRouter(container),
    shortcuts: router(createShortcutRoutes(shortcutService)),
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
