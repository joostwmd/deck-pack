import type { createDb } from "@deck-pack/db";
import * as schema from "@deck-pack/db/schema/auth";
import { APIError, betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP, type Member } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { organizationOwner, organizationAdmin, organizationMember, ac } from "./utils/rbac";

const ADMIN_EMAIL_DOMAIN = "code.berlin";

export type AuthDb = ReturnType<typeof createDb>;

export type OtpEmailType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export type SendOtp = (args: { email: string; otp: string; type: OtpEmailType }) => Promise<void>;

export interface AuthDeps {
  db: AuthDb;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  sendOtp: SendOtp;
}

function baseAuthOptions(
  deps: AuthDeps,
  overrides: Pick<
    BetterAuthOptions,
    "basePath" | "advanced" | "plugins" | "hooks" | "databaseHooks"
  >,
): BetterAuthOptions {
  const { db, secret, baseURL, trustedOrigins } = deps;

  return {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins,
    secret,
    baseURL,
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

/** Populates active org on session when user is a member (shared by ops + app). */
async function sessionCreateAfter(
  session: { id: string; userId: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Better Auth internal context
  ctx: any,
) {
  const member = (await ctx!.context.adapter.findOne({
    model: "member",
    where: [{ field: "userId", value: session.userId }],
  })) as Member;

  console.log("member", member);
  if (member) {
    const org = await ctx!.context.adapter.findOne({
      model: "organization",
      where: [{ field: "id", value: member.organizationId }],
    });
    console.log("organization", org);
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
 * Internal ops / admin sign-in. Restricted to @code.berlin; users promoted to
 * platform `admin` on first sign-up.
 */
export function createOpsAuth(deps: AuthDeps) {
  const { sendOtp } = deps;

  return betterAuth(
    baseAuthOptions(deps, {
      basePath: "/api/auth/ops",
      advanced: {
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
        },
        cookiePrefix: "ops",
      },
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
      ],
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          if (ctx.path === "/email-otp/send-verification-otp") {
            const email = ctx.body?.email as string;
            if (!email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
              throw new APIError("BAD_REQUEST", {
                message: `Email must use the @${ADMIN_EMAIL_DOMAIN} domain.`,
              });
            }
          }
          if (ctx.path === "/sign-in/email-otp") {
            const email = ctx.body?.email as string;
            if (!email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
              throw new APIError("BAD_REQUEST", {
                message: `Email must use the @${ADMIN_EMAIL_DOMAIN} domain.`,
              });
            }
          }
        }),
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user, ctx) => {
              if (user.email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
                console.log("promoting to admin", user.id);
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
            //after: sessionCreateAfter,
          },
        },
      },
    }),
  );
}

/**
 * Customer-facing app auth (portal, addins, etc.). No domain restriction, no
 * admin plugin.
 */
export function createAppAuth(deps: AuthDeps) {
  const { sendOtp } = deps;

  return betterAuth(
    baseAuthOptions(deps, {
      basePath: "/api/auth/app",
      advanced: {
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
        },
        cookiePrefix: "app",
      },
      plugins: [
        emailOTP({
          async sendVerificationOTP({ email, otp, type }) {
            await sendOtp({ email, otp, type });
          },
        }),
        organizationPlugin,
      ],
      databaseHooks: {
        session: {
          create: {
            after: sessionCreateAfter,
          },
        },
      },
    }),
  );
}
