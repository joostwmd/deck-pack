import type { z } from "zod";

import { searchShapesMock } from "./mock-data";
import type { shapeSearchInputSchema } from "./schemas";

export function createShapeService() {
  return {
    search: async (input: z.infer<typeof shapeSearchInputSchema>) => {
      return searchShapesMock(input);
    },
  };
}

export type ShapeService = ReturnType<typeof createShapeService>;
