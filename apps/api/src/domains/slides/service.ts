import type { z } from "zod";

import { searchSlidesMock } from "./mock-data";
import type { slideSearchInputSchema } from "./schemas";

export function createSlideService() {
  return {
    search: async (input: z.infer<typeof slideSearchInputSchema>) => {
      return searchSlidesMock(input);
    },
  };
}

export type SlideService = ReturnType<typeof createSlideService>;
