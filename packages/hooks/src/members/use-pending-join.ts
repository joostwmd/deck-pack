import { useQuery } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function usePendingJoin(members: MembersStore) {
  return useQuery({
    queryKey: membersKeys.pendingJoin(),
    queryFn: () => members.getPendingJoin(),
  });
}
