import { useQuery } from "@tanstack/react-query";

import type { SeatsStore } from "./seats-store";
import { seatsKeys } from "./query-keys";

export function useSeatCapacity(seats: SeatsStore) {
  return useQuery({
    queryKey: seatsKeys.capacity(),
    queryFn: () => seats.capacity(),
  });
}
