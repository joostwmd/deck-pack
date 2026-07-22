import { errorMapperMiddleware } from "./error-mapping";
import { t } from "./init";
import { requireAuthenticatedSession } from "./guards/middleware/require-authenticated-session";
import { requireOrganizationMembership } from "./guards/middleware/require-organization-membership";
import { requirePlatformAdmin } from "./guards/middleware/require-platform-admin";
import { requirePermission } from "./guards/middleware/require-permission";
import { requireActiveSeat } from "./guards/middleware/require-active-seat";
import { requireSoloWorkspace } from "./guards/middleware/require-solo-workspace";
import { requireTeamWorkspace } from "./guards/middleware/require-team-workspace";

export const publicProcedure = t.procedure.use(errorMapperMiddleware);

export const protectedProcedure = publicProcedure.use(requireAuthenticatedSession);

export const organizationMemberProcedure = protectedProcedure.use(requireOrganizationMembership);

/** Org member in a team workspace (members, seats assign, org library, etc.). */
export const teamWorkspaceProcedure = organizationMemberProcedure.use(requireTeamWorkspace);

/** Org member in a solo (individual) workspace. */
export const soloWorkspaceProcedure = organizationMemberProcedure.use(requireSoloWorkspace);

/** Add-in procedures that require an active named seat. */
export const addinLicensedProcedure = organizationMemberProcedure
  .use(requirePermission({ asset: ["insert"] }))
  .use(requireActiveSeat);

/**
 * Org-scoped domain routes: define named procedures in domains/<domain>/procedures.ts
 * built from organizationMemberProcedure.use(requirePermission({ ... })).
 * routes.ts must only use those exports; services stay permission-free.
 */
export const platformAdminProcedure = protectedProcedure.use(requirePlatformAdmin);
