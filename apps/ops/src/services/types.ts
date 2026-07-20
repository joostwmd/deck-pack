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
  impersonateUser: (userId: string) => ReturnType<AuthClient["admin"]["impersonateUser"]>;
  stopImpersonating: () => ReturnType<AuthClient["admin"]["stopImpersonating"]>;
}

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerEmail: string | null;
};

export type OrganizationDetail = OrganizationSummary & {
  ownerName: string | null;
  memberCount: number;
};

export type OrganizationMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  memberRole: string | null;
};

export interface OrganizationStore {
  lookupUser: (email: string) => Promise<
    | { found: true; name: string; email: string; hasOrg: boolean }
    | { found: false }
  >;
  listOrganizations: () => Promise<OrganizationSummary[]>;
  getOrganization: (organizationId: string) => Promise<OrganizationDetail>;
  listMembers: (organizationId: string) => Promise<OrganizationMember[]>;
  createOrganization: (input: {
    name: string;
    slug: string;
    ownerEmail: string;
  }) => Promise<{ organizationId: string; userId: string; isNewUser: boolean }>;
  updateOrganization: (input: {
    organizationId: string;
    name: string;
    slug: string;
  }) => Promise<{ id: string; name: string; slug: string; createdAt: Date }>;
  deleteOrganization: (organizationId: string) => Promise<{ organizationId: string }>;
}

export interface UsersStore {
  listUsers: () => Promise<PlatformUser[]>;
  deleteUser: (userId: string) => Promise<{ userId: string }>;
}

export type PlanLimit = {
  assetType:
    | "logo"
    | "flag"
    | "icon"
    | "harvey_ball"
    | "photo"
    | "slide"
    | "shape";
  /** Null means unlimited. */
  insertsPerMonth: number | null;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  limits: PlanLimit[];
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  planId: string;
  planName: string;
  planSlug: string;
  quantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface BillingStore {
  listPlans: () => Promise<Plan[]>;
  getPlan: (planId: string) => Promise<Plan>;
  createPlan: (input: {
    name: string;
    slug: string;
    limits: PlanLimit[];
  }) => Promise<Plan>;
  updatePlan: (input: {
    planId: string;
    name: string;
    slug: string;
    limits: PlanLimit[];
  }) => Promise<Plan>;
  listOrganizationSubscriptions: () => Promise<OrganizationSubscription[]>;
  getOrganizationSubscription: (subscriptionId: string) => Promise<OrganizationSubscription>;
  createOrganizationSubscription: (input: {
    organizationId: string;
    planId: string;
    quantity: number;
  }) => Promise<{
    id: string;
    organizationId: string;
    planId: string;
    quantity: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  updateOrganizationSubscription: (input: {
    subscriptionId: string;
    planId?: string;
    quantity?: number;
    status?: "active" | "canceled";
  }) => Promise<{
    id: string;
    organizationId: string;
    planId: string;
    quantity: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface OpsAppServices {
  auth: AuthService;
  organization: OrganizationStore;
  users: UsersStore;
  billing: BillingStore;
}
