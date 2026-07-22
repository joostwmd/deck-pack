import { useMutation, useQueryClient } from "@tanstack/react-query";

import { seatsKeys } from "../seats/query-keys";
import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useRemoveMember(members: MembersStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string }) => members.remove(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.list() });
      void queryClient.invalidateQueries({ queryKey: seatsKeys.list() });
    },
  });
}
