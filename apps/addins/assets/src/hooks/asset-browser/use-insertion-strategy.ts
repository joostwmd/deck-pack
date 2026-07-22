import { useMemo } from "react";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import type { InsertionStrategy } from "@/utils/insertion-strategy";
import { createInsertionTracker } from "@/utils/track-asset-insertion";
import { useServices } from "@/services/services-context";

export function useInsertionStrategy(): InsertionStrategy | null {
  const { isOfficeAvailable } = useEnvironment();
  const webCanvas = useWebCanvasOptional();
  const { insertion, insertions, office } = useServices();
  const tracker = useMemo(() => createInsertionTracker(insertions), [insertions]);

  return useMemo(() => {
    if (isOfficeAvailable) {
      return insertion.createOfficeStrategy(office, tracker);
    }

    return webCanvas ? insertion.createCanvasStrategy(webCanvas, tracker) : null;
  }, [insertion, insertions, isOfficeAvailable, office, tracker, webCanvas]);
}
