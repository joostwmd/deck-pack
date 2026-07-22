import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useUpdateMemberRole(members: MembersStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; role: string }) => members.updateRole(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}
