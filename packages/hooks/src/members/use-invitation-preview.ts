import { useQuery } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useInvitationPreview(members: MembersStore, invitationId: string) {
  return useQuery({
    queryKey: membersKeys.invitationPreview(invitationId),
    queryFn: () => members.getInvitationPreview({ invitationId }),
    enabled: Boolean(invitationId),
  });
}
