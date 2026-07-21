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
import { createFlagRoutes } from "../domains/flags/routes";
import { createFlagService } from "../domains/flags/service";
import { createIconRoutes } from "../domains/icons/routes";
import { createIconService } from "../domains/icons/service";
import { billingRouter } from "../routers/billing-router";
import { brandProfilesRouter } from "../routers/brand-profiles-router";
import { galleryRouter } from "../routers/gallery-router";
import { logosRouter } from "../routers/logos-router";
import { membersRouter } from "../routers/members-router";
import { organizationRouter } from "../routers/organization-router";
import { usersRouter } from "../routers/users-router";
import { seatsRouter } from "../routers/seats-router";
import { usageRouter } from "../routers/usage-router";
import { AppContainer } from "../container";
import { createPhotoRoutes } from "../domains/photos/routes";
import { createPhotoService } from "../domains/photos/service";
import { createShapeRoutes } from "../domains/shapes/routes";
import { createShapeService } from "../domains/shapes/service";
import { createShortcutRoutes } from "../domains/shortcuts/routes";
import { createShortcutService } from "../domains/shortcuts/service";
import { createSlideRoutes } from "../domains/slides/routes";
import { createSlideService } from "../domains/slides/service";
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

export function createAppRouter(deps: AddinRouterDeps, container: AppContainer) {
  const storage = deps.storage ?? container.objectStorage;
  const photoService = createPhotoService({
    pexels: deps.pexels ?? new PexelsClient(deps.pexelsApiKey),
  });
  const slideService = createSlideService({ storage });
  const shapeService = createShapeService({ storage });
  const iconService = createIconService({
    nounProject:
      deps.nounProject ??
      new NounProjectClient({
        apiKey: deps.nounProjectApiKey,
        apiSecret: deps.nounProjectApiSecret,
      }),
  });
  const flagService = createFlagService({ storage });
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
      photos: router(createPhotoRoutes(photoService)),
      slides: router(createSlideRoutes(slideService)),
      shapes: router(createShapeRoutes(shapeService)),
      icons: router(createIconRoutes(iconService)),
      logos: logosRouter(container),
      flags: router(createFlagRoutes(flagService)),
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
