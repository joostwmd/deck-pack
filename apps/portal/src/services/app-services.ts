import { createOrgLibraryStore } from "@/features/library-gallery/org-library-store";
import { getAuthClient } from "@/utils/auth";

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
    library: createOrgLibraryStore(),
  };
}
