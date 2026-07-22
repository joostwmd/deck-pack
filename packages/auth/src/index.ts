import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@deck-pack/db/schema/auth";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, emailOTP, testUtils, type Member } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import {
  organizationOwner,
  organizationAdmin,
  organizationMember,
  organizationAddinUser,
  organizationLibraryManager,
  ac,
} from "./utils/rbac";
import { createMicrosoftIdTokenVerifier } from "./microsoft-id-token";
import { assertOpsOtpAllowed, emailMatchesAdminDomain } from "./ops-soft-gate";
import { workspaceFromOrganizationMetadata, type WorkspaceKind } from "./workspace";

/** Avoid importing `@deck-pack/db` entry (loads `@deck-pack/env` / DATABASE_URL). */
export type AuthDb = NodePgDatabase<typeof schema>;

export type OtpEmailType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export type SendOtp = (args: { email: string; otp: string; type: OtpEmailType }) => Promise<void>;

export type SendOrganizationInvitation = (args: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
}) => Promise<void>;

export interface AuthDeps {
  db: AuthDb;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  sendOtp: SendOtp;
  sendOrganizationInvitation: SendOrganizationInvitation;
  /** Portal origin for invite links (no trailing slash). */
  portalAppUrl: string;
  adminEmailDomain: string;
  opsOrigins: string[];
  microsoftOAuth?: {
    clientId: string;
    clientSecret: string;
  };
  /**
   * When true, registers Better Auth `testUtils({ captureOTP: true })`.
   * For test/auth factories only — never enable in production server configs.
   */
  enableTestUtils?: boolean;
}

/**
 * Runtime DB helpers — lazy so `schema.ts` / `auth:generate` can import createAuth
 * without loading `@deck-pack/env` (which requires DATABASE_URL etc.).
 */
async function loadDbRuntime() {
  const [
    { unitOfWork },
    { DrizzleBillingRepository },
    { DrizzleOrganizationRepository },
    { activateSeatForUser, findPendingOrgIntentByEmail },
  ] = await Promise.all([
    import("@deck-pack/db"),
    import("@deck-pack/billing"),
    import("@deck-pack/organization"),
    import("./session-db"),
  ]);
  const billingRepository = new DrizzleBillingRepository(unitOfWork);
  const organizationRepository = new DrizzleOrganizationRepository(unitOfWork, billingRepository);
  return { unitOfWork, organizationRepository, activateSeatForUser, findPendingOrgIntentByEmail };
}

function baseAuthOptions(
  deps: AuthDeps,
  overrides: Pick<
    BetterAuthOptions,
    "plugins" | "hooks" | "databaseHooks" | "socialProviders" | "account"
  >,
): BetterAuthOptions {
  const { db, secret, baseURL, trustedOrigins } = deps;
  const secureCookies = baseURL.startsWith("https://");

  return {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins,
    secret,
    baseURL,
    basePath: "/api/auth",
    advanced: {
      defaultCookieAttributes: {
        sameSite: secureCookies ? "none" : "lax",
        secure: secureCookies,
        httpOnly: true,
      },
      cookiePrefix: "deckpack",
    },
    emailAndPassword: {
      enabled: false,
    },
    session: {
      additionalFields: {
        workspace: {
          type: ["solo", "team"],
          required: false,
          input: false,
          returned: true,
        },
      },
    },
    ...overrides,
  } satisfies BetterAuthOptions;
}

/** Populates active org on session when user is a member; activates pending seats on login. */
async function sessionCreateAfter(
  session: { id: string; userId: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Better Auth internal context
  ctx: any,
) {
  // `testUtils().login()` creates sessions without a request context.
  const adapter = ctx?.context?.adapter;
  if (!adapter) {
    return;
  }
  const { unitOfWork, organizationRepository, activateSeatForUser, findPendingOrgIntentByEmail } =
    await loadDbRuntime();

  const userRecord = (await adapter.findOne({
    model: "user",
    where: [{ field: "id", value: session.userId }],
  })) as { email?: string } | null;

  if (userRecord?.email) {
    await activateSeatForUser(unitOfWork, {
      userId: session.userId,
      email: userRecord.email,
    }).catch(() => {
      // Seat activation is best-effort; membership may still apply below.
    });
  }

  let member = (await adapter.findOne({
    model: "member",
    where: [{ field: "userId", value: session.userId }],
  })) as Member | null;

  // Only bootstrap a personal org when there is no membership and no pending
  // invite/seat (pending intent should win — user joins that org instead).
  if (!member && userRecord?.email) {
    const pendingIntent = await findPendingOrgIntentByEmail(unitOfWork, {
      email: userRecord.email,
    }).catch(() => null);

    if (!pendingIntent) {
      const bootstrap = await organizationRepository
        .bootstrapPersonalOrganization({
          userId: session.userId,
          email: userRecord.email,
          name: userRecord.email.split("@")[0],
        })
        .catch((error: unknown) => {
          console.error("bootstrapPersonalOrganization on session failed", {
            userId: session.userId,
            error,
          });
          return null;
        });

      if (bootstrap?.ok) {
        member = (await adapter.findOne({
          model: "member",
          where: [{ field: "userId", value: session.userId }],
        })) as Member | null;
      }
    }
  }

  if (member) {
    const org = (await adapter.findOne({
      model: "organization",
      where: [{ field: "id", value: member.organizationId }],
    })) as { metadata?: string | null } | null;

    const workspace: WorkspaceKind | null = workspaceFromOrganizationMetadata(org?.metadata);

    await adapter.update({
      model: "session",
      where: [{ field: "id", value: session.id }],
      update: {
        activeOrganizationId: member.organizationId,
      },
    });

    if (workspace) {
      await adapter
        .update({
          model: "session",
          where: [{ field: "id", value: session.id }],
          update: { workspace },
        })
        .catch((error: unknown) => {
          console.error("Failed to set session.workspace (run migration 0009_session_workspace?)", {
            sessionId: session.id,
            error,
          });
        });
    }
  }
}

/**
 * Unified Better Auth for ops, portal, and add-in.
 * Admin promotion is domain-only; ops OTP is soft-gated by Origin.
 */
export function createAuth(deps: AuthDeps) {
  const {
    sendOtp,
    sendOrganizationInvitation,
    portalAppUrl,
    adminEmailDomain,
    opsOrigins,
    microsoftOAuth,
  } = deps;

  const portalOrigin = portalAppUrl.replace(/\/$/, "");

  const organizationPlugin = organization({
    ac: ac,
    roles: {
      organizationOwner,
      organizationAdmin,
      organizationMember,
      organizationAddinUser,
      organizationLibraryManager,
    },
    allowUserToCreateOrganization: false,
    organizationLimit: 1,
    sendInvitationEmail: async (data) => {
      await sendOrganizationInvitation({
        to: data.email,
        organizationName: data.organization.name,
        inviterName: data.inviter.user.name,
        inviteLink: `${portalOrigin}/accept-invitation/${data.id}`,
      });
    },
  });

  return betterAuth(
    baseAuthOptions(deps, {
      ...(microsoftOAuth
        ? {
            socialProviders: {
              microsoft: {
                clientId: microsoftOAuth.clientId,
                clientSecret: microsoftOAuth.clientSecret,
                tenantId: "common",
                prompt: "select_account",
                verifyIdToken: createMicrosoftIdTokenVerifier({
                  clientId: microsoftOAuth.clientId,
                }),
                mapProfileToUser: (profile: { email?: string; preferred_username?: string }) => ({
                  email: profile.email ?? profile.preferred_username,
                }),
              },
            },
            account: {
              accountLinking: {
                enabled: true,
                trustedProviders: ["microsoft"],
              },
            },
          }
        : {}),
      plugins: [
        ...(deps.enableTestUtils ? [testUtils({ captureOTP: true })] : []),
        emailOTP({
          async sendVerificationOTP({ email, otp, type }) {
            await sendOtp({ email, otp, type });
          },
        }),
        admin({
          impersonationSessionDuration: 1000 * 60 * 60 * 24 * 30,
        }),
        organizationPlugin,
        bearer({ requireSignature: true }),
      ],
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          const email =
            (ctx.body?.email as string | undefined) ?? (ctx.body?.identifier as string | undefined);

          assertOpsOtpAllowed({
            path: ctx.path,
            email,
            headers: ctx.request?.headers ?? new Headers(),
            opsOrigins,
            adminEmailDomain,
          });
        }),
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user, ctx) => {
              if (emailMatchesAdminDomain(user.email, adminEmailDomain)) {
                await ctx?.context.adapter.update({
                  model: "user",
                  where: [{ field: "id", value: user.id }],
                  update: {
                    role: "admin",
                  },
                });
              }

              const { unitOfWork, organizationRepository, findPendingOrgIntentByEmail } =
                await loadDbRuntime();

              const pendingIntent = await findPendingOrgIntentByEmail(unitOfWork, {
                email: user.email,
              }).catch(() => null);

              // Pending invite/seat wins — do not create a personal org that would
              // block joining the company workspace.
              if (pendingIntent) {
                return;
              }

              await organizationRepository
                .bootstrapPersonalOrganization({
                  userId: user.id,
                  email: user.email,
                  name: user.name,
                })
                .catch((error: unknown) => {
                  console.error("bootstrapPersonalOrganization failed", {
                    userId: user.id,
                    error,
                  });
                });
            },
          },
        },
        session: {
          create: {
            after: (session, ctx) => sessionCreateAfter(session, ctx),
          },
        },
      },
    }),
  );
}
