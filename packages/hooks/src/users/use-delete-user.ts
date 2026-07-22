import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UsersStore } from "./users-store";
import { usersKeys } from "./query-keys";

export function useDeleteUser(users: UsersStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => users.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}
