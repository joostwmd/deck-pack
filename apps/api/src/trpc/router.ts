import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import {
  createBrandProfile,
  duplicateBrandProfile,
} from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { getPlan } from "@deck-pack/db/queries/getPlan";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import { countInsertionsByAssetTypeForOrgPeriod } from "@deck-pack/db/queries/countInsertionsForOrgPeriod";
import { listInsertionSeriesForOrg } from "@deck-pack/db/queries/listInsertionSeriesForOrg";
import { listSeatUsageForOrg } from "@deck-pack/db/queries/listSeatUsageForOrg";
import {
  assertInsertAllowed,
  getEntitlementWindow,
  getUsagePeriodContext,
} from "@deck-pack/db/queries/usage-entitlements";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";
import { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";

import { createAddinRoutes } from "../domains/addin/routes";
import { createAddinService } from "../domains/addin/service";
import { createAgendaRoutes } from "../domains/agenda/routes";
import { createAgendaService } from "../domains/agenda/service";
import { createBrandProfileRoutes } from "../domains/brand-profiles/routes";
import { createBrandProfileService } from "../domains/brand-profiles/service";
import { createFlagRoutes } from "../domains/flags/routes";
import { createFlagService } from "../domains/flags/service";
import { createIconRoutes } from "../domains/icons/routes";
import { createIconService } from "../domains/icons/service";
import { createLogoRoutes } from "../domains/logos/routes";
import { createLogoService } from "../domains/logos/service";
import { billingRouter } from "../routers/billing-router";
import { membersRouter } from "../routers/members-router";
import { organizationRouter } from "../routers/organization-router";
import { usersRouter } from "../routers/users-router";
import { seatsRouter } from "../routers/seats-router";
import { AppContainer } from "../container";
import { createPhotoRoutes } from "../domains/photos/routes";
import { createPhotoService } from "../domains/photos/service";
import { createShapeRoutes } from "../domains/shapes/routes";
import { createShapeService } from "../domains/shapes/service";
import { createShortcutRoutes } from "../domains/shortcuts/routes";
import { createShortcutService } from "../domains/shortcuts/service";
import { createSlideRoutes } from "../domains/slides/routes";
import { createSlideService } from "../domains/slides/service";
import { createUsageRoutes } from "../domains/usage/routes";
import { createUsageService } from "../domains/usage/service";
import { createLibraryRoutes } from "../domains/library/routes";
import { createOrgLibraryRoutes } from "../domains/library/org-routes";
import { createLibraryService } from "../domains/library/service";
import { createOrgLibraryService } from "../domains/library/org-service";
import { systemRoutes } from "../domains/system/routes";
import {
  createAzureObjectStorage,
  createMemoryObjectStorage,
  type ObjectStorage,
} from "@deck-pack/storage";
import { env } from "@deck-pack/env/server";

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

function resolveObjectStorage(explicit?: ObjectStorage): ObjectStorage {
  if (explicit) return explicit;
  if (env.AZURE_STORAGE_ACCOUNT_NAME && env.AZURE_STORAGE_CONTAINER) {
    return createAzureObjectStorage({
      accountName: env.AZURE_STORAGE_ACCOUNT_NAME,
      containerName: env.AZURE_STORAGE_CONTAINER,
    });
  }
  return createMemoryObjectStorage();
}

export function createAppRouter(deps: AddinRouterDeps, container: AppContainer) {
  const storage = resolveObjectStorage(deps.storage);
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
  const logoService = createLogoService({
    brandfetch:
      deps.brandfetch ??
      new BrandfetchClient({
        apiKey: deps.brandfetchApiKey,
        clientId: deps.brandfetchClientId,
      }),
  });
  const flagService = createFlagService({ storage });
  const addinService = createAddinService({ insertAssetInsertion, assertInsertAllowed });

  const usageService = createUsageService({
    getActiveOrganizationSubscriptionByOrgId,
    getPlan,
    getEntitlementWindow,
    getUsagePeriodContext,
    countInsertionsByAssetTypeForOrgPeriod,
    listInsertionSeriesForOrg,
    listSeatUsageForOrg,
  });

  const agendaService = createAgendaService({
    syncAgenda,
    getAgendaInstance,
  });

  const brandProfileService = createBrandProfileService({
    listBrandProfilesByUser,
    getBrandProfileWithVersion,
    createBrandProfile,
    createBrandProfileVersion,
    updateBrandProfileMetadata,
    duplicateBrandProfile,
    setDefaultBrandProfile,
    archiveBrandProfile,
  });

  const shortcutService = createShortcutService({
    listAllShortcutOverridesByUser,
    upsertShortcutOverride,
    deleteShortcutOverride,
    deleteAllShortcutOverrides,
  });

  const libraryService = createLibraryService({ storage });
  const orgLibraryService = createOrgLibraryService({ storage });

  return router({
    ...systemRoutes,
    organization: organizationRouter(container),
    members: membersRouter(container),
    seats: seatsRouter(container),
    usage: router(createUsageRoutes(usageService)),
    users: usersRouter(container),
    billing: billingRouter(container),
    library: router({
      ...createLibraryRoutes(libraryService),
      org: router(createOrgLibraryRoutes(orgLibraryService)),
    }),
    assets: router({
      photos: router(createPhotoRoutes(photoService)),
      slides: router(createSlideRoutes(slideService)),
      shapes: router(createShapeRoutes(shapeService)),
      icons: router(createIconRoutes(iconService)),
      logos: router(createLogoRoutes(logoService)),
      flags: router(createFlagRoutes(flagService)),
    }),
    addin: router(createAddinRoutes(addinService)),
    agenda: router(createAgendaRoutes(agendaService)),
    brandProfiles: router(createBrandProfileRoutes(brandProfileService)),
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
