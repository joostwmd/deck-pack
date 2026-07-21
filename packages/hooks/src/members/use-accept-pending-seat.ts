import { useMutation } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";

export function useAcceptPendingSeat(members: MembersStore) {
  return useMutation({
    mutationFn: (input: { confirmReplace: boolean }) => members.acceptPendingSeat(input),
  });
}
