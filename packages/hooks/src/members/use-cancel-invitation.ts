import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useCancelInvitation(members: MembersStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { invitationId: string }) => members.cancelInvitation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}
