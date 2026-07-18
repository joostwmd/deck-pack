import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import {
  createBrandProfile,
  duplicateBrandProfile,
} from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { createOrganizationWithOwner } from "@deck-pack/db/queries/createOrganizationWithOwner";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { getOrganizationWithOwner } from "@deck-pack/db/queries/getOrganizationWithOwner";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { listOrganizationMembers } from "@deck-pack/db/queries/listOrganizationMembers";
import { listOrganizationsWithOwner } from "@deck-pack/db/queries/listOrganizationsWithOwner";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";
import { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";
import { updateOrganization } from "@deck-pack/db/queries/updateOrganization";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import { Icons8Client } from "@deck-pack/integrations/icons8";
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
import { createOrganizationRoutes } from "../domains/organization/routes";
import { createOrganizationService } from "../domains/organization/service";
import { createPhotoRoutes } from "../domains/photos/routes";
import { createPhotoService } from "../domains/photos/service";
import { createShapeRoutes } from "../domains/shapes/routes";
import { createShapeService } from "../domains/shapes/service";
import { createShortcutRoutes } from "../domains/shortcuts/routes";
import { createShortcutService } from "../domains/shortcuts/service";
import { createSlideRoutes } from "../domains/slides/routes";
import { createSlideService } from "../domains/slides/service";
import { systemRoutes } from "../domains/system/routes";

import { router } from "./setup";

export type AddinRouterDeps = {
  brandfetchApiKey: string;
  icons8ApiKey: string;
  pexelsApiKey: string;
  pexels?: PexelsClient;
  icons8?: Icons8Client;
  brandfetch?: BrandfetchClient;
};

export function createAppRouter(deps: AddinRouterDeps) {
  const photoService = createPhotoService({
    pexels: deps.pexels ?? new PexelsClient(deps.pexelsApiKey),
  });
  const slideService = createSlideService();
  const shapeService = createShapeService();
  const iconService = createIconService({
    icons8: deps.icons8 ?? new Icons8Client(deps.icons8ApiKey),
  });
  const logoService = createLogoService({
    brandfetch: deps.brandfetch ?? new BrandfetchClient(deps.brandfetchApiKey),
  });
  const flagService = createFlagService();
  const addinService = createAddinService({ insertAssetInsertion });

  const organizationService = createOrganizationService({
    findUserByEmail,
    listOrganizationsWithOwner,
    createOrganizationWithOwner,
    getOrganizationWithOwner,
    listOrganizationMembers,
    updateOrganization,
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

  return router({
    ...systemRoutes,
    organization: router(createOrganizationRoutes(organizationService)),
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

export const appRouter = createAppRouter({
  brandfetchApiKey: "dummy-key-for-now",
  icons8ApiKey: "dummy-key-for-now",
  pexelsApiKey: "dummy-key-for-now",
});

export type AppRouter = typeof appRouter;
