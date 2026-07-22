import type { ShapeSelection } from "@deck-pack/shape-commands";
import { GEOMETRY_EPSILON } from "@deck-pack/shape-commands";
import { CircleNotch } from "@phosphor-icons/react";

interface SelectionSummaryProps {
  selection: ShapeSelection | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function summarizeTypes(selection: ShapeSelection): string {
  const counts = new Map<string, number>();

  for (const shape of selection.shapes) {
    const label = shape.type.toLowerCase();
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => `${count} ${type}${count === 1 ? "" : "s"}`)
    .join(" · ");
}

export function SelectionSummary({ selection, isRefreshing, onRefresh }: SelectionSummaryProps) {
  const count = selection?.shapes.length ?? 0;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {count === 0
            ? "No objects selected"
            : `${count} object${count === 1 ? "" : "s"} selected`}
        </p>
        {selection && count > 0 ? (
          <p className="truncate text-xs text-muted-foreground">{summarizeTypes(selection)}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select objects on the slide, then apply a formatting action here.
          </p>
        )}
      </div>

      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onRefresh}
        aria-label="Refresh selection"
      >
        {isRefreshing ? <CircleNotch className="size-3.5 animate-spin" /> : null}
        Refresh
      </button>
    </div>
  );
}

export function getSharedNumericValue(values: number[]): string {
  if (values.length === 0) return "";
  const [first, ...rest] = values;
  return rest.every((value) => Math.abs(value - first!) <= GEOMETRY_EPSILON)
    ? String(Math.round(first! * 100) / 100)
    : "";
}
