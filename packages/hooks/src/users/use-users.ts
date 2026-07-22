import { useQuery } from "@tanstack/react-query";

import type { UsersStore } from "./users-store";
import { usersKeys } from "./query-keys";

export function useUsers(users: UsersStore) {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: () => users.listUsers(),
  });
}
