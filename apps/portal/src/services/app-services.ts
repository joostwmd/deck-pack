import { createTrpcOrganizationProfileStore } from "@deck-pack/hooks/billing";
import { createTrpcGalleryStore } from "@deck-pack/hooks/gallery";
import { createTrpcMembersStore } from "@deck-pack/hooks/members";
import { createTrpcSeatsStore } from "@deck-pack/hooks/seats";
import { createTrpcUsageStore } from "@deck-pack/hooks/usage";
import { createTrpcUsersStore } from "@deck-pack/hooks/users";

import { getAuthClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

import type { AuthService, PortalAppServices } from "./types";

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
    stopImpersonating: () => auth.admin.stopImpersonating(),
  };
}

export function createAppServices(): PortalAppServices {
  return {
    auth: createAuthService(),
    gallery: createTrpcGalleryStore(trpcClient.gallery.org as never),
    members: createTrpcMembersStore(trpcClient.members as never),
    seats: createTrpcSeatsStore(trpcClient.seats as never),
    billing: createTrpcOrganizationProfileStore(trpcClient.members as never),
    usage: createTrpcUsageStore(trpcClient.usage as never),
    users: createTrpcUsersStore(trpcClient.users as never),
  };
}
