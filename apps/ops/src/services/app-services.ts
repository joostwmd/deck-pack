import { authClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

import type { AuthService, OpsAppServices, OrganizationStore } from "./types";

function createAuthService(): AuthService {
  const auth = authClient;

  return {
    getSession: () => auth.getSession(),
    useSession: () => auth.useSession(),
    signOut: (input) => auth.signOut(input),
    sendVerificationOtp: (input) => auth.emailOtp.sendVerificationOtp(input),
    signInWithEmailOtp: (input) => auth.signIn.emailOtp(input),
    signInWithEmail: (input, callbacks) => auth.signIn.email(input, callbacks),
    signUpWithEmail: (input, callbacks) => auth.signUp.email(input, callbacks),
  };
}

function createOrganizationStore(): OrganizationStore {
  const api = trpcClient;

  return {
    lookupUser: (email) => api.organization.lookupUser.query({ email }),
    listOrganizations: () => api.organization.listOrganizations.query(),
    getOrganization: (organizationId) =>
      api.organization.getOrganization.query({ organizationId }),
    listMembers: (organizationId) => api.organization.listMembers.query({ organizationId }),
    createOrganization: (input) => api.organization.createOrganization.mutate(input),
    updateOrganization: (input) => api.organization.updateOrganization.mutate(input),
  };
}

export function createAppServices(): OpsAppServices {
  return {
    auth: createAuthService(),
    organization: createOrganizationStore(),
  };
}
