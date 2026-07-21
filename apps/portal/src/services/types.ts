import type { AuthClient } from "@deck-pack/auth/client";
import type { GalleryStore } from "@deck-pack/hooks/gallery";

export interface AuthService {
  getSession: AuthClient["getSession"];
  useSession: AuthClient["useSession"];
  signOut: AuthClient["signOut"];
  sendVerificationOtp: (input: {
    email: string;
    type: "sign-in";
  }) => ReturnType<AuthClient["emailOtp"]["sendVerificationOtp"]>;
  signInWithEmailOtp: (input: {
    email: string;
    otp: string;
    name: string;
  }) => ReturnType<AuthClient["signIn"]["emailOtp"]>;
  signInWithEmail: (
    input: { email: string; password: string },
    callbacks?: Parameters<AuthClient["signIn"]["email"]>[1],
  ) => ReturnType<AuthClient["signIn"]["email"]>;
  signUpWithEmail: (
    input: { email: string; password: string; name: string },
    callbacks?: Parameters<AuthClient["signUp"]["email"]>[1],
  ) => ReturnType<AuthClient["signUp"]["email"]>;
  stopImpersonating: () => ReturnType<AuthClient["admin"]["stopImpersonating"]>;
}

export interface PortalAppServices {
  auth: AuthService;
  gallery: GalleryStore;
}
