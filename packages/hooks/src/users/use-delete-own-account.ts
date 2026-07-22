import { useMutation } from "@tanstack/react-query";

import type { UsersStore } from "./users-store";

export function useDeleteOwnAccount(users: Pick<UsersStore, "deleteOwnAccount">) {
  return useMutation({
    mutationFn: () => users.deleteOwnAccount(),
  });
}
