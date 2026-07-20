import { errorMapperMiddleware } from "./resilience/error-mapping";
import { isAuthenticated } from "./guards/authentication";
import { t } from "./setup";
import { isOrganizationMember } from "./guards/authorization";
import { isPlatformAdmin } from "./guards/authorization";

export const publicProcedure = t.procedure.use(errorMapperMiddleware);

export const protectedProcedure = publicProcedure.use(isAuthenticated);

export const organizationMemberProcedure = protectedProcedure.use(isOrganizationMember);

/**
 * Org-scoped domain routes: define named procedures in domains/<domain>/procedures.ts
 * built from organizationMemberProcedure.use(requirePermission({ ... })).
 * routes.ts must only use those exports; services stay permission-free.
 */
export const platformAdminProcedure = protectedProcedure.use(isPlatformAdmin);
