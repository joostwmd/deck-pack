import { auth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";
import { getSessionCookieName } from "@deck-pack/auth/session-cookie";

type CreateInvitationApi = {
  createInvitation: (args: {
    body: {
      email: string;
      role: string;
      organizationId?: string;
      resend?: boolean;
    };
    headers: Headers;
  }) => Promise<{ id: string }>;
};

/**
 * Mirror bearer → session cookie the same way Hono session middleware does,
 * so auth.api.createInvitation works for cookie and bearer clients.
 */
function headersWithBearerCookie(headers: Headers): Headers {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return headers;
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return headers;
  }

  const augmented = new Headers(headers);
  const existingCookie = augmented.get("cookie");
  const sessionCookie = `${getSessionCookieName(env.BETTER_AUTH_URL)}=${token}`;
  augmented.set("cookie", existingCookie ? `${existingCookie}; ${sessionCookie}` : sessionCookie);
  return augmented;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      body?: { message?: unknown };
    };
    if (typeof record.body?.message === "string") return record.body.message;
    if (typeof record.message === "string") return record.message;
  }
  return "Could not create invitation";
}

export type CreateInvitationViaAuthResult =
  | { ok: true; invitationId: string }
  | {
      ok: false;
      reason: "already_member" | "already_invited" | "forbidden" | "failed";
      message: string;
    };

/**
 * Creates an org invitation through Better Auth so `sendInvitationEmail` runs (Resend).
 */
export async function createInvitationViaAuth(input: {
  email: string;
  role: string;
  organizationId: string;
  headers: Headers;
}): Promise<CreateInvitationViaAuthResult> {
  try {
    // Plugin endpoints are present at runtime; createAuth typing does not always infer them.
    const authApi = auth.api as unknown as CreateInvitationApi;
    const invitation = await authApi.createInvitation({
      body: {
        email: input.email,
        role: input.role,
        organizationId: input.organizationId,
        resend: true,
      },
      headers: headersWithBearerCookie(input.headers),
    });

    if (!invitation?.id) {
      return { ok: false, reason: "failed", message: "Invitation was not created" };
    }

    return { ok: true, invitationId: invitation.id };
  } catch (error) {
    const message = errorMessage(error);
    const lower = message.toLowerCase();
    if (lower.includes("already a member")) {
      return { ok: false, reason: "already_member", message };
    }
    if (lower.includes("already invited")) {
      return { ok: false, reason: "already_invited", message };
    }
    if (lower.includes("not allowed") || lower.includes("forbidden")) {
      return { ok: false, reason: "forbidden", message };
    }
    return { ok: false, reason: "failed", message };
  }
}
