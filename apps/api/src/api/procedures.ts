import { errorMapperMiddleware } from "./resilience/error-mapping";
import { isAuthenticated } from "./guards/authentication";
import { t, middleware } from "./setup";
import { isOrganizationMember } from "./guards/authorization";
import { isPlatformAdmin } from "./guards/authorization";
import { requirePermission } from "./guards/authorization";
import { assertActiveSeat } from "./guards/active-seat";
import { requireActiveOrganizationId } from "./guards/org-context";
import { requireSoloWorkspace, requireTeamWorkspace } from "./guards/org-type";

export const publicProcedure = t.procedure.use(errorMapperMiddleware);

export const protectedProcedure = publicProcedure.use(isAuthenticated);

export const organizationMemberProcedure = protectedProcedure.use(isOrganizationMember);

/** Org member in a team workspace (members, seats assign, org library, etc.). */
export const teamWorkspaceProcedure = organizationMemberProcedure.use(requireTeamWorkspace);

/** Org member in a solo (individual) workspace. */
export const soloWorkspaceProcedure = organizationMemberProcedure.use(requireSoloWorkspace);

/** Add-in procedures that require an active named seat. */
export const addinLicensedProcedure = organizationMemberProcedure
  .use(requirePermission({ asset: ["insert"] }))
  .use(
    middleware(async ({ ctx, next }) => {
      const organizationId = requireActiveOrganizationId(ctx);
      await assertActiveSeat(ctx.tx, {
        organizationId,
        userId: ctx.session!.user.id,
      });
      return next({ ctx });
    }),
  );

/**
 * Org-scoped domain routes: define named procedures in domains/<domain>/procedures.ts
 * built from organizationMemberProcedure.use(requirePermission({ ... })).
 * routes.ts must only use those exports; services stay permission-free.
 */
export const platformAdminProcedure = protectedProcedure.use(isPlatformAdmin);
