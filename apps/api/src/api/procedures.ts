import { errorMapperMiddleware } from "./resilience/error-mapping";
import { isAuthenticated } from "./guards/authentication";
import { t } from "./setup";

export const publicProcedure = t.procedure.use(errorMapperMiddleware);

export const protectedProcedure = publicProcedure.use(isAuthenticated);
