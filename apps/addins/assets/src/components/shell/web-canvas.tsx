import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useCallback, useRef } from "react";

import { useWebCanvas } from "@/contexts/web-canvas-context";
import { clampCanvasPosition, deltaPxToFraction } from "@/utils/canvas-position";

import { WaitlistBanner } from "@/components/shell/waitlist/waitlist-banner";

import { CanvasDownloadButton } from "./canvas-download-button";
import { CanvasItem } from "./canvas-item";

/** Canvas is 16:9; square item height as fraction of canvas height */
const CANVAS_ASPECT = 16 / 9;

function getHeightFraction(itemWidth: number) {
  return itemWidth * CANVAS_ASPECT;
}

export function WebCanvas() {
  const { items, updateItemPosition } = useWebCanvas();
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const canvas = canvasRef.current;
      const { active, delta } = event;

      if (!canvas || (delta.x === 0 && delta.y === 0)) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const item = items.find((entry) => entry.instanceId === active.id);

      if (!item) {
        return;
      }

      const deltaFraction = deltaPxToFraction(delta.x, delta.y, rect.width, rect.height);
      const heightFraction = getHeightFraction(item.width);
      const nextPosition = clampCanvasPosition(
        item.x + deltaFraction.x,
        item.y + deltaFraction.y,
        item.width,
        heightFraction,
      );

      updateItemPosition(item.instanceId, nextPosition);
    },
    [items, updateItemPosition],
  );

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-muted/40">
      <WaitlistBanner />

      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            ref={canvasRef}
            className="relative aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-sm border bg-white shadow-sm"
          >
            {items.length === 0 ? (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted-foreground">
                Your slide preview will appear here. Search for an asset in the sidebar and add it
                to the canvas.
              </div>
            ) : null}

            {items.map((item) => (
              <CanvasItem
                key={item.instanceId}
                item={item}
                heightFraction={getHeightFraction(item.width)}
              />
            ))}
          </div>
        </DndContext>
      </div>

      <CanvasDownloadButton />
    </main>
  );
}
