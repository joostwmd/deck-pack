import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef, type ReactNode } from "react";

interface SelectableGridProps {
  ariaLabel: string;
  highlightedId?: string | null;
  className?: string;
  children: ReactNode;
}

export function SelectableGrid({
  ariaLabel,
  highlightedId = null,
  className,
  children,
}: SelectableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlightedItem = gridRef.current?.querySelector<HTMLButtonElement>(
      '[data-highlighted="true"]',
    );

    if (!highlightedItem) {
      return;
    }

    highlightedItem.focus({ preventScroll: true });
    highlightedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [highlightedId]);

  return (
    <div
      ref={gridRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid w-full grid-cols-2 gap-3", className)}
    >
      {children}
    </div>
  );
}
