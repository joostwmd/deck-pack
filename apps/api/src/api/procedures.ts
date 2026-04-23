import { errorMapperMiddleware } from "./resilience/error-mapping";
import { isAuthenticated } from "./guards/authentication";
import { t } from "./setup";
import { isOrganizationMember } from "./guards/authorization";
import { isPlatformAdmin } from "./guards/authorization";

export const publicProcedure = t.procedure.use(errorMapperMiddleware);

export const protectedProcedure = publicProcedure.use(isAuthenticated);

export const organizationMemberProcedure = protectedProcedure.use(isOrganizationMember);
export const platformAdminProcedure = protectedProcedure.use(isPlatformAdmin);
