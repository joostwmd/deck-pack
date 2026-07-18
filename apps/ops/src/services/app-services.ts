import { getAuthClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

import type { AuthService, OpsAppServices, OrganizationStore } from "./types";

function createAuthService(): AuthService {
  const auth = getAuthClient();

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
    createOrganization: (input) => api.organization.createOrganization.mutate(input),
  };
}

export function createAppServices(): OpsAppServices {
  return {
    auth: createAuthService(),
    organization: createOrganizationStore(),
  };
}
