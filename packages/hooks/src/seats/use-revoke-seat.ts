import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SeatsStore } from "./seats-store";
import { seatsKeys } from "./query-keys";

export function useRevokeSeat(seats: SeatsStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { seatId: string }) => seats.revoke(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seatsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: seatsKeys.capacity() });
    },
  });
}
