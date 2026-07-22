import { useMutation } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";

export function useAcceptInvitation(members: MembersStore) {
  return useMutation({
    mutationFn: (input: { invitationId: string; confirmReplace: boolean }) =>
      members.acceptInvitation(input),
  });
}
