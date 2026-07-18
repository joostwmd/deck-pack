import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AssetInsertPayload } from "@/types/asset-types";

export interface PlacedCanvasItem {
  instanceId: string;
  variantId: string;
  name: string;
  imageUrl: string;
  insert: AssetInsertPayload;
  metadata: Record<string, string>;
  /** Fraction 0–1 of canvas width */
  x: number;
  /** Fraction 0–1 of canvas height */
  y: number;
  /** Fraction of canvas width */
  width: number;
}

export type NewCanvasItem = Omit<PlacedCanvasItem, "instanceId" | "x" | "y" | "width">;

const DEFAULT_ITEM_WIDTH = 0.2;
const DEFAULT_BASE_X = 0.35;
const DEFAULT_BASE_Y = 0.35;
const STAGGER = 0.03;

function createDefaultPlacement(index: number): Pick<PlacedCanvasItem, "x" | "y" | "width"> {
  return {
    x: DEFAULT_BASE_X + index * STAGGER,
    y: DEFAULT_BASE_Y + index * STAGGER,
    width: DEFAULT_ITEM_WIDTH,
  };
}

export interface WebCanvasContextValue {
  items: PlacedCanvasItem[];
  addToCanvas: (item: NewCanvasItem) => void;
  updateItemPosition: (instanceId: string, position: { x: number; y: number }) => void;
  removeItem: (instanceId: string) => void;
  clearCanvas: () => void;
}

const WebCanvasContext = createContext<WebCanvasContextValue | null>(null);

export function WebCanvasProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PlacedCanvasItem[]>([]);

  const addToCanvas = useCallback((nextItem: NewCanvasItem) => {
    setItems((prev) => {
      const placement = createDefaultPlacement(prev.length);

      return [
        ...prev,
        {
          ...nextItem,
          instanceId: crypto.randomUUID(),
          ...placement,
        },
      ];
    });
  }, []);

  const updateItemPosition = useCallback(
    (instanceId: string, position: { x: number; y: number }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.instanceId === instanceId ? { ...item, x: position.x, y: position.y } : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((instanceId: string) => {
    setItems((prev) => prev.filter((item) => item.instanceId !== instanceId));
  }, []);

  const clearCanvas = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      addToCanvas,
      updateItemPosition,
      removeItem,
      clearCanvas,
    }),
    [items, addToCanvas, updateItemPosition, removeItem, clearCanvas],
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
