import { useQuery } from "@tanstack/react-query";

import type { MembersStore } from "./members-store";
import { membersKeys } from "./query-keys";

export function useMembers(members: MembersStore) {
  return useQuery({
    queryKey: membersKeys.list(),
    queryFn: () => members.list(),
  });
}
