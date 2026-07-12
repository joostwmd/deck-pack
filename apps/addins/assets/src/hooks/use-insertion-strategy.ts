import { useMemo } from "react";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import {
  createCanvasStrategy,
  officeInsertionStrategy,
  type InsertionStrategy,
} from "@/lib/insertion-strategy";

export function useInsertionStrategy(): InsertionStrategy | null {
  const { isOfficeAvailable } = useEnvironment();
  const webCanvas = useWebCanvasOptional();

  return useMemo(() => {
    if (isOfficeAvailable) {
      return officeInsertionStrategy;
    }

    return webCanvas ? createCanvasStrategy(webCanvas) : null;
  }, [isOfficeAvailable, webCanvas]);
}
