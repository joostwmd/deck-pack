import { useDraggable } from "@dnd-kit/core";
import { memo } from "react";

import type { PlacedCanvasItem } from "@/contexts/web-canvas-context";

interface CanvasItemProps {
  item: PlacedCanvasItem;
  heightFraction: number;
}

function toTransformString(x: number, y: number) {
  return `translate3d(${x}px, ${y}px, 0)`;
}

export const CanvasItem = memo(function CanvasItem({ item, heightFraction }: CanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.instanceId,
  });

  const style = {
    left: `${item.x * 100}%`,
    top: `${item.y * 100}%`,
    width: `${item.width * 100}%`,
    height: `${heightFraction * 100}%`,
    transform: transform ? toTransformString(transform.x, transform.y) : undefined,
    touchAction: "none",
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute cursor-grab select-none ${isDragging ? "cursor-grabbing" : ""}`}
      {...listeners}
      {...attributes}
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        draggable={false}
        className="pointer-events-none size-full object-contain"
      />
    </div>
  );
});
