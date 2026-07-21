import { useMutation, useQueryClient } from "@tanstack/react-query";

import { seatsKeys } from "../seats/query-keys";
import type { AddMemberInput, MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useAddMember(members: MembersStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) => members.add(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.list() });
      void queryClient.invalidateQueries({ queryKey: seatsKeys.list() });
    },
  });
}
