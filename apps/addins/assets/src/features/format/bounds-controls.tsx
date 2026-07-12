import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import type { ShapeSelection } from "@deck-pack/presentation-formatting";
import { useMemo, useState } from "react";

import { getSharedNumericValue, SelectionSummary } from "./selection-summary";

interface BoundsControlsProps {
  selection: ShapeSelection | null;
  busy?: boolean;
  onApply: (values: { left?: number; top?: number; width?: number; height?: number }) => void;
}

type FieldKey = "left" | "top" | "width" | "height";

const fieldLabels: Record<FieldKey, string> = {
  left: "X",
  top: "Y",
  width: "W",
  height: "H",
};

export function BoundsControls({ selection, busy = false, onApply }: BoundsControlsProps) {
  const [draft, setDraft] = useState<Partial<Record<FieldKey, string>>>({});

  const sharedValues = useMemo(() => {
    if (!selection || selection.shapes.length === 0) {
      return { left: "", top: "", width: "", height: "" };
    }

    return {
      left: getSharedNumericValue(selection.shapes.map((shape) => shape.rawBounds.left)),
      top: getSharedNumericValue(selection.shapes.map((shape) => shape.rawBounds.top)),
      width: getSharedNumericValue(selection.shapes.map((shape) => shape.rawBounds.width)),
      height: getSharedNumericValue(selection.shapes.map((shape) => shape.rawBounds.height)),
    };
  }, [selection]);

  const commit = (field: FieldKey) => {
    const raw = draft[field] ?? sharedValues[field];
    if (!raw) return;

    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    if ((field === "width" || field === "height") && value <= 0) return;

    onApply({ [field]: value });
    setDraft((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(fieldLabels) as FieldKey[]).map((field) => (
          <label key={field} className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">{fieldLabels[field]}</span>
            <Input
              value={draft[field] ?? sharedValues[field]}
              placeholder={sharedValues[field] ? undefined : "Mixed"}
              disabled={!selection || selection.shapes.length === 0 || busy}
              onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
              onBlur={() => commit(field)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commit(field);
                }
              }}
            />
          </label>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        disabled={!selection || selection.shapes.length === 0 || busy}
        onClick={() => {
          const payload: { left?: number; top?: number; width?: number; height?: number } = {};
          for (const field of Object.keys(fieldLabels) as FieldKey[]) {
            const raw = draft[field] ?? sharedValues[field];
            if (!raw) continue;
            const value = Number(raw);
            if (!Number.isFinite(value)) continue;
            if ((field === "width" || field === "height") && value <= 0) continue;
            payload[field] = value;
          }

          if (Object.keys(payload).length > 0) {
            onApply(payload);
          }
        }}
      >
        Apply position & size
      </Button>
    </div>
  );
}

export { SelectionSummary };
