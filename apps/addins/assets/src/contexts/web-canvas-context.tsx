import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AssetInsertPayload } from "@/lib/asset-types";

export interface CanvasItem {
  id: string;
  name: string;
  imageUrl: string;
  insert: AssetInsertPayload;
  metadata: Record<string, string>;
}

interface WebCanvasContextValue {
  item: CanvasItem | null;
  addToCanvas: (item: CanvasItem) => void;
  clearCanvas: () => void;
}

const WebCanvasContext = createContext<WebCanvasContextValue | null>(null);

export function WebCanvasProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<CanvasItem | null>(null);

  const addToCanvas = useCallback((nextItem: CanvasItem) => {
    setItem(nextItem);
  }, []);

  const clearCanvas = useCallback(() => {
    setItem(null);
  }, []);

  const value = useMemo(
    () => ({
      item,
      addToCanvas,
      clearCanvas,
    }),
    [item, addToCanvas, clearCanvas],
  );

  return <WebCanvasContext.Provider value={value}>{children}</WebCanvasContext.Provider>;
}

export function useWebCanvas() {
  const context = useContext(WebCanvasContext);

  if (!context) {
    throw new Error("useWebCanvas must be used within a WebCanvasProvider");
  }

  return context;
}

export function useWebCanvasOptional() {
  return useContext(WebCanvasContext);
}
