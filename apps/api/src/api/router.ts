import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { archiveBrandProfile } from "@deck-pack/db/queries/archiveBrandProfile";
import {
  createBrandProfile,
  duplicateBrandProfile,
} from "@deck-pack/db/queries/createBrandProfile";
import { createBrandProfileVersion } from "@deck-pack/db/queries/createBrandProfileVersion";
import { createOrganizationSubscription } from "@deck-pack/db/queries/createOrganizationSubscription";
import { createOrganizationWithOwner } from "@deck-pack/db/queries/createOrganizationWithOwner";
import { createPlan } from "@deck-pack/db/queries/createPlan";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteOrganization } from "@deck-pack/db/queries/deleteOrganization";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { deleteUser } from "@deck-pack/db/queries/deleteUser";
import { assignOrganizationSeat } from "@deck-pack/db/queries/assignOrganizationSeat";
import { countAssignedSeats } from "@deck-pack/db/queries/countAssignedSeats";
import { addOrganizationMember } from "@deck-pack/db/queries/addOrganizationMember";
import { cancelInvitation } from "@deck-pack/db/queries/listPendingInvitations";
import { createInvitationViaAuth } from "../domains/members/create-invitation-via-auth";
import { findUserByEmail } from "@deck-pack/db/queries/findUserByEmail";
import { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import { listOrganizationSeats } from "@deck-pack/db/queries/listOrganizationSeats";
import { listPendingInvitations } from "@deck-pack/db/queries/listPendingInvitations";
import { removeOrganizationMember } from "@deck-pack/db/queries/removeOrganizationMember";
import { revokeOrganizationSeat } from "@deck-pack/db/queries/revokeOrganizationSeat";
import { updateOrganizationMemberRole } from "@deck-pack/db/queries/updateOrganizationMemberRole";
import { getInvitationById } from "@deck-pack/db/queries/getInvitationById";
import { getCurrentMembershipSummary } from "@deck-pack/db/queries/getCurrentMembershipSummary";
import { vacateCurrentOrganization } from "@deck-pack/db/queries/vacateCurrentOrganization";
import { acceptInvitationForUser } from "@deck-pack/db/queries/acceptInvitationForUser";
import { findPendingOrgIntentByEmail } from "@deck-pack/db/queries/findPendingOrgIntentByEmail";
import { activateSeatForUser } from "@deck-pack/db/queries/activateSeatForUser";
import { setSessionActiveOrganization } from "@deck-pack/db/queries/setSessionActiveOrganization";
import { getAgendaInstance } from "@deck-pack/db/queries/getAgendaInstance";
import { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";
import { getOrganizationSubscription } from "@deck-pack/db/queries/getOrganizationSubscription";
import { getOrganizationMetadataById } from "@deck-pack/db/queries/getOrganizationMetadataById";
import { getOrganizationWithOwner } from "@deck-pack/db/queries/getOrganizationWithOwner";
import { getPlan } from "@deck-pack/db/queries/getPlan";
import { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import { listOrganizationMembers } from "@deck-pack/db/queries/listOrganizationMembers";
import { listOrganizationSubscriptions } from "@deck-pack/db/queries/listOrganizationSubscriptions";
import { listOrganizationsWithOwner } from "@deck-pack/db/queries/listOrganizationsWithOwner";
import { listPlans } from "@deck-pack/db/queries/listPlans";
import { listUsersWithMembership } from "@deck-pack/db/queries/listUsersWithMembership";
import { setDefaultBrandProfile } from "@deck-pack/db/queries/setDefaultBrandProfile";
import { syncAgenda } from "@deck-pack/db/queries/syncAgenda";
import { updateBrandProfileMetadata } from "@deck-pack/db/queries/updateBrandProfileMetadata";
import { updateOrganization } from "@deck-pack/db/queries/updateOrganization";
import { updateOrganizationSubscription } from "@deck-pack/db/queries/updateOrganizationSubscription";
import { updatePlan } from "@deck-pack/db/queries/updatePlan";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";

import { createAddinRoutes } from "../domains/addin/routes";
import { createAddinService } from "../domains/addin/service";
import { createAgendaRoutes } from "../domains/agenda/routes";
import { createAgendaService } from "../domains/agenda/service";
import { createBillingRoutes } from "../domains/billing/routes";
import { createBillingService } from "../domains/billing/service";
import { createBrandProfileRoutes } from "../domains/brand-profiles/routes";
import { createBrandProfileService } from "../domains/brand-profiles/service";
import { createFlagRoutes } from "../domains/flags/routes";
import { createFlagService } from "../domains/flags/service";
import { createIconRoutes } from "../domains/icons/routes";
import { createIconService } from "../domains/icons/service";
import { createLogoRoutes } from "../domains/logos/routes";
import { createLogoService } from "../domains/logos/service";
import { createMembersRoutes } from "../domains/members/routes";
import { createMembersService } from "../domains/members/service";
import { createOrganizationRoutes } from "../domains/organization/routes";
import { createOrganizationService } from "../domains/organization/service";
import { createSeatsRoutes } from "../domains/seats/routes";
import { createSeatsService } from "../domains/seats/service";
import { createPhotoRoutes } from "../domains/photos/routes";
import { createPhotoService } from "../domains/photos/service";
import { createShapeRoutes } from "../domains/shapes/routes";
import { createShapeService } from "../domains/shapes/service";
import { createShortcutRoutes } from "../domains/shortcuts/routes";
import { createShortcutService } from "../domains/shortcuts/service";
import { createSlideRoutes } from "../domains/slides/routes";
import { createSlideService } from "../domains/slides/service";
import { createUsersRoutes } from "../domains/users/routes";
import { createUsersService } from "../domains/users/service";
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

import { router } from "./setup";

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

export function createAppRouter(deps: AddinRouterDeps) {
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
  const addinService = createAddinService({ insertAssetInsertion });

  const organizationService = createOrganizationService({
    findUserByEmail,
    listOrganizationsWithOwner,
    createOrganizationWithOwner,
    getOrganizationWithOwner,
    listOrganizationMembers,
    updateOrganization,
    deleteOrganization,
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

  const usersService = createUsersService({
    listUsersWithMembership,
    deleteUser,
  });

  const billingService = createBillingService({
    listPlans,
    getPlan,
    createPlan,
    updatePlan,
    listOrganizationSubscriptions,
    getOrganizationSubscription,
    createOrganizationSubscription,
    updateOrganizationSubscription,
  });

  const seatsService = createSeatsService({
    getActiveOrganizationSubscriptionByOrgId,
    countAssignedSeats,
    listOrganizationSeats,
    assignOrganizationSeat,
    revokeOrganizationSeat,
    findUserByEmail,
  });

  const membersService = createMembersService({
    listOrganizationMembers,
    listPendingInvitations,
    findUserByEmail,
    addOrganizationMember,
    createInvitation: createInvitationViaAuth,
    updateOrganizationMemberRole,
    removeOrganizationMember,
    cancelInvitation,
    assignOrganizationSeat,
    getOrganizationMetadataById,
    getActiveOrganizationSubscriptionByOrgId,
    getPlan,
    getInvitationById,
    getCurrentMembershipSummary,
    vacateCurrentOrganization,
    acceptInvitationForUser,
    findPendingOrgIntentByEmail,
    activateSeatForUser,
    setSessionActiveOrganization,
  });

  const libraryService = createLibraryService({ storage });
  const orgLibraryService = createOrgLibraryService({ storage });

  return router({
    ...systemRoutes,
    organization: router(createOrganizationRoutes(organizationService)),
    members: router(createMembersRoutes(membersService)),
    seats: router(createSeatsRoutes(seatsService)),
    users: router(createUsersRoutes(usersService)),
    billing: router(createBillingRoutes(billingService)),
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

export const appRouter = createAppRouter({
  brandfetchApiKey: "dummy-key-for-now",
  brandfetchClientId: "dummy-client-id-for-now",
  nounProjectApiKey: "dummy-key-for-now",
  nounProjectApiSecret: "dummy-secret-for-now",
  pexelsApiKey: "dummy-key-for-now",
});

export type AppRouter = typeof appRouter;
