import type { AuthClient } from "@deck-pack/auth/client";
import type { BillingStore } from "@deck-pack/hooks/billing";
import type { GalleryStore } from "@deck-pack/hooks/gallery";
import type { OrganizationStore } from "@deck-pack/hooks/organization";
import type { UsersStore } from "@deck-pack/hooks/users";
import type { createTrpcBrowserBundle } from "@deck-pack/trpc-client";
import type { AppRouter } from "@deck-pack/api/routers/index";

export type { AuthClient };
export type TrpcClient = ReturnType<typeof createTrpcBrowserBundle<AppRouter>>["trpcClient"];

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
  impersonateUser: (userId: string) => ReturnType<AuthClient["admin"]["impersonateUser"]>;
  stopImpersonating: () => ReturnType<AuthClient["admin"]["stopImpersonating"]>;
}

export type {
  CreateOrganizationInput,
  CreateOrganizationResult,
  LookupUserResult,
  OrganizationDetail,
  OrganizationMember,
  OrganizationStore,
  OrganizationSummary,
  UpdateOrganizationInput,
  UpdateOrganizationResult,
} from "@deck-pack/hooks/organization";
export type { PlatformUser, UsersStore } from "@deck-pack/hooks/users";
export type {
  BillingStore,
  OrganizationSubscription,
  Plan,
  PlanAssetType,
  PlanLimit,
} from "@deck-pack/hooks/billing";
export type { GalleryStore };

export interface OpsAppServices {
  auth: AuthService;
  organization: OrganizationStore;
  users: UsersStore;
  billing: BillingStore;
  gallery: GalleryStore;
}
