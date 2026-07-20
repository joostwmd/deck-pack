import { getRouteApi } from "@tanstack/react-router";

import { MembersView } from "@/features/members/members-view";

const membersRoute = getRouteApi("/_protected/org/members");

export function MembersPanel() {
  const { activeOrganizationId } = membersRoute.useRouteContext();

  if (!activeOrganizationId) {
    return null;
  }

  return <MembersView activeOrganizationId={activeOrganizationId} />;
}
