import { portalHomePath, workspaceFromSession } from "@/config/portal-nav";
import { getAuthClient } from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";

export type PortalPostAuthDestination =
  | { to: "/accept-invitation/$invitationId"; params: { invitationId: string } }
  | { to: "/join" }
  | { to: ReturnType<typeof portalHomePath> };

/** Prefer pending invite/seat over solo/team home after sign-in. */
export async function resolvePortalPostAuthDestination(): Promise<PortalPostAuthDestination> {
  const session = await getAuthClient().getSession();

  const pending = await trpcClient.members.getPendingJoin.query().catch(() => null);
  if (pending?.kind === "invitation" && pending.invitationId) {
    return {
      to: "/accept-invitation/$invitationId",
      params: { invitationId: pending.invitationId },
    };
  }
  if (pending?.kind === "seat") {
    return { to: "/join" };
  }

  let workspace = workspaceFromSession(session.data?.session);
  if (session.data?.session?.activeOrganizationId) {
    const profile = await trpcClient.members.getOrganizationProfile.query();
    workspace = profile.workspace ?? workspace;
  }
  return { to: portalHomePath(workspace) };
}
