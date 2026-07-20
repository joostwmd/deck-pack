import type { createDb } from "@deck-pack/db";
import * as schema from "@deck-pack/db/schema/auth";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, emailOTP, type Member } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { organizationOwner, organizationAdmin, organizationMember, ac } from "./utils/rbac";
import { createMicrosoftIdTokenVerifier } from "./microsoft-id-token";
import { assertOpsOtpAllowed, emailMatchesAdminDomain } from "./ops-soft-gate";

export type AuthDb = ReturnType<typeof createDb>;

export type OtpEmailType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export type SendOtp = (args: { email: string; otp: string; type: OtpEmailType }) => Promise<void>;

export interface AuthDeps {
  db: AuthDb;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  sendOtp: SendOtp;
  adminEmailDomain: string;
  opsOrigins: string[];
  microsoftOAuth?: {
    clientId: string;
    clientSecret: string;
  };
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
    ...overrides,
  } satisfies BetterAuthOptions;
}

const organizationPlugin = organization({
  ac: ac,
  roles: { organizationOwner, organizationAdmin, organizationMember },
  allowUserToCreateOrganization: false,
  organizationLimit: 1,
  sendInvitationEmail: async (data) => {
    console.log("sendInvitationEmail", data);
    //await sendInvitationEmail(data);
  },
});

/** Populates active org on session when user is a member. */
async function sessionCreateAfter(
  session: { id: string; userId: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Better Auth internal context
  ctx: any,
) {
  const member = (await ctx!.context.adapter.findOne({
    model: "member",
    where: [{ field: "userId", value: session.userId }],
  })) as Member;

  if (member) {
    await ctx!.context.adapter.update({
      model: "session",
      where: [{ field: "id", value: session.id }],
      update: {
        activeOrganizationId: member.organizationId,
        role: member.role,
      },
    });
  }
}

/**
 * Unified Better Auth for ops, portal, and add-in.
 * Admin promotion is domain-only; ops OTP is soft-gated by Origin.
 */
export function createAuth(deps: AuthDeps) {
  const { sendOtp, adminEmailDomain, opsOrigins, microsoftOAuth } = deps;

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
            (ctx.body?.email as string | undefined) ??
            (ctx.body?.identifier as string | undefined);

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
            },
          },
        },
        session: {
          create: {
            after: sessionCreateAfter,
          },
        },
      },
    }),
  );
}
