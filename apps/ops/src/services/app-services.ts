import { authClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

import type {
  AuthService,
  BillingStore,
  LibraryStore,
  OpsAppServices,
  OrganizationStore,
  UsersStore,
} from "./types";

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
    impersonateUser: (userId) => auth.admin.impersonateUser({ userId }),
    stopImpersonating: () => auth.admin.stopImpersonating(),
  };
}

function createOrganizationStore(): OrganizationStore {
  const api = trpcClient;

  return {
    lookupUser: (email) => api.organization.lookupUser.query({ email }),
    listOrganizations: () => api.organization.listOrganizations.query(),
    getOrganization: (organizationId) => api.organization.getOrganization.query({ organizationId }),
    listMembers: (organizationId) => api.organization.listMembers.query({ organizationId }),
    createOrganization: (input) => api.organization.createOrganization.mutate(input),
    updateOrganization: (input) => api.organization.updateOrganization.mutate(input),
    deleteOrganization: (organizationId) =>
      api.organization.deleteOrganization.mutate({ organizationId }),
  };
}

function createUsersStore(): UsersStore {
  return {
    listUsers: () => trpcClient.users.listUsers.query(),
    deleteUser: (userId) => trpcClient.users.deleteUser.mutate({ userId }),
  };
}

function createBillingStore(): BillingStore {
  return {
    listPlans: () => trpcClient.billing.listPlans.query(),
    getPlan: (planId) => trpcClient.billing.getPlan.query({ planId }),
    createPlan: (input) => trpcClient.billing.createPlan.mutate(input),
    updatePlan: (input) => trpcClient.billing.updatePlan.mutate(input),
    listOrganizationSubscriptions: () => trpcClient.billing.listOrganizationSubscriptions.query(),
    getOrganizationSubscription: (subscriptionId) =>
      trpcClient.billing.getOrganizationSubscription.query({ subscriptionId }),
    createOrganizationSubscription: (input) =>
      trpcClient.billing.createOrganizationSubscription.mutate(input),
    updateOrganizationSubscription: (input) =>
      trpcClient.billing.updateOrganizationSubscription.mutate(input),
  };
}

function createGalleryStore(): LibraryStore {
  const api = trpcClient.gallery;
  return {
    list: (input) => api.list.query(input),
    get: (input) => api.get.query(input),
    create: (input) => api.create.mutate(input as Parameters<typeof api.create.mutate>[0]),
    update: (input) => api.update.mutate(input as Parameters<typeof api.update.mutate>[0]),
    publish: (input) => api.publish.mutate(input),
    unpublish: (input) => api.unpublish.mutate(input),
    archive: (input) => api.archive.mutate(input),
    createUploadTarget: (input) => api.createUploadTarget.mutate(input),
    finalizeUpload: (input) => api.finalizeUpload.mutate(input),
    putAndFinalize: (input) => api.putAndFinalize.mutate(input),
  };
}

export function createAppServices(): OpsAppServices {
  return {
    auth: createAuthService(),
    organization: createOrganizationStore(),
    users: createUsersStore(),
    billing: createBillingStore(),
    library: createGalleryStore(),
  };
}
