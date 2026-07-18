import type { AuthClient } from "@deck-pack/auth/client";
import type { createTrpcBrowserBundle } from "@deck-pack/trpc-client";
import type { AppRouter } from "@deck-pack/api/routers/index";

export type { AuthClient };
export type TrpcClient = ReturnType<typeof createTrpcBrowserBundle<AppRouter>>["trpcClient"];

export interface AuthService {
  getSession: AuthClient["getSession"];
  useSession: AuthClient["useSession"];
  signOut: AuthClient["signOut"];
  sendVerificationOtp: (input: { email: string; type: "sign-in" }) => ReturnType<
    AuthClient["emailOtp"]["sendVerificationOtp"]
  >;
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
}

export interface OrganizationStore {
  lookupUser: (email: string) => Promise<
    | { found: true; name: string; email: string; hasOrg: boolean }
    | { found: false }
  >;
  listOrganizations: () => Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      ownerEmail: string | null;
    }>
  >;
  createOrganization: (input: {
    name: string;
    slug: string;
    ownerEmail: string;
  }) => Promise<{ organizationId: string; userId: string; isNewUser: boolean }>;
}

export interface OpsAppServices {
  auth: AuthService;
  organization: OrganizationStore;
}
