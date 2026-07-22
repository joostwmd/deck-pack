import { auth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";
import {
  BetterAuthInvitationPort,
  type InvitationPort,
} from "@deck-pack/members/integrations/invitation-port";

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

/** Production invitation port wired to Better Auth (Resend email side effect). */
export function createBetterAuthInvitationPort(): InvitationPort {
  const authApi = auth.api as unknown as CreateInvitationApi;
  return new BetterAuthInvitationPort({
    createInvitation: (args) => authApi.createInvitation(args),
    betterAuthUrl: env.BETTER_AUTH_URL,
  });
}
