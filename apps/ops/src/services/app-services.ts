import { authClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

import { createTrpcBillingStore } from "@deck-pack/hooks/billing";
import { createTrpcGalleryStore } from "@deck-pack/hooks/gallery";
import { createTrpcOrganizationStore } from "@deck-pack/hooks/organization";
import { createTrpcUsersStore } from "@deck-pack/hooks/users";

import type { AuthService, OpsAppServices } from "./types";

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

export function createAppServices(): OpsAppServices {
  return {
    auth: createAuthService(),
    organization: createTrpcOrganizationStore(trpcClient.organization as never),
    users: createTrpcUsersStore(trpcClient.users as never),
    billing: createTrpcBillingStore(trpcClient.billing as never),
    gallery: createTrpcGalleryStore(trpcClient.gallery as never),
  };
}
