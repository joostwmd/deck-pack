import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SeatsStore } from "./seats-store";
import { seatsKeys } from "./query-keys";

export function useAssignSeat(seats: SeatsStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string }) => seats.assign(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seatsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: seatsKeys.capacity() });
    },
  });
}
