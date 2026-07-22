import { useQuery } from "@tanstack/react-query";

import type { SeatsStore } from "./seats-store";
import { seatsKeys } from "./query-keys";

export function useSeats(seats: SeatsStore) {
  return useQuery({
    queryKey: seatsKeys.list(),
    queryFn: () => seats.list(),
  });
}
