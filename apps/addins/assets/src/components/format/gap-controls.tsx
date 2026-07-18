import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import { useState } from "react";

interface GapExactControlsProps {
  disabled?: boolean;
  busy?: boolean;
  onApplyHorizontal: (value: number) => void;
  onApplyVertical: (value: number) => void;
}

function GapExactAxisControl({
  label,
  disabled,
  busy,
  onApply,
}: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onApply: (value: number) => void;
}) {
  const [value, setValue] = useState("12");

  return (
    <div className="grid gap-2">
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Input
          type="number"
          min={0}
          step={1}
          value={value}
          disabled={disabled || busy}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <Button
        type="button"
        size="sm"
        disabled={disabled || busy}
        onClick={() => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || parsed < 0) return;
          onApply(parsed);
        }}
      >
        Apply exact gap
      </Button>
    </div>
  );
}

export function GapExactControls({
  disabled = false,
  busy = false,
  onApplyHorizontal,
  onApplyVertical,
}: GapExactControlsProps) {
  return (
    <div className="grid gap-3">
      <GapExactAxisControl
        label="Exact horizontal gap (pt)"
        disabled={disabled}
        busy={busy}
        onApply={onApplyHorizontal}
      />
      <GapExactAxisControl
        label="Exact vertical gap (pt)"
        disabled={disabled}
        busy={busy}
        onApply={onApplyVertical}
      />
    </div>
  );
}
