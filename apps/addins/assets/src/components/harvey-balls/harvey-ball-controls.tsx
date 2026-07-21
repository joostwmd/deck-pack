import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@deck-pack/ui/components/system/color-picker";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { Slider } from "@deck-pack/ui/components/system/slider";
import { cn } from "@deck-pack/ui/lib/utils";
import { useMemo } from "react";

import {
  HARVEY_BALL_PRESETS,
  normalizeHarveyBallConfig,
  type HarveyBallConfig,
} from "@/utils/harvey-ball-svg";

interface HarveyBallControlsProps {
  config: HarveyBallConfig;
  onChange: (next: Partial<HarveyBallConfig>) => void;
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const labelId = `${id}-label`;

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{label}</Label>
      <ColorPicker
        value={value}
        onValueChange={onChange}
        defaultFormat="hex"
        format="hex"
        aria-labelledby={labelId}
      >
        <div className="flex items-center gap-2">
          <ColorPickerTrigger
            className="size-10 shrink-0 rounded-md border border-border bg-background p-1 hover:bg-muted"
            aria-label={`${label} picker`}
          >
            <ColorPickerSwatch className="size-full border-0 shadow-none" />
          </ColorPickerTrigger>
          <ColorPickerInput withoutAlpha className="flex-1 font-mono text-sm" />
        </div>
        <ColorPickerContent align="start" className="w-[min(340px,calc(100vw-2rem))]">
          <ColorPickerArea />
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper variant="outline" size="icon" />
            <ColorPickerHueSlider className="flex-1" />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
}

export function HarveyBallControls({ config, onChange }: HarveyBallControlsProps) {
  const normalized = normalizeHarveyBallConfig(config);
  const sliderValue = useMemo(() => [normalized.percentage], [normalized.percentage]);

  const handlePercentageSliderChange = (value: number | readonly number[]) => {
    const percentage = Array.isArray(value) ? value[0] : value;

    if (typeof percentage !== "number" || Number.isNaN(percentage)) {
      return;
    }

    onChange({ percentage });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Presets</Label>
        <div className="flex flex-wrap gap-2">
          {HARVEY_BALL_PRESETS.map((preset) => {
            const isSelected = normalized.percentage === preset;

            return (
              <button
                key={preset}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  "rounded-3xl border px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted/60",
                )}
                onClick={() => onChange({ percentage: preset })}
              >
                {preset}%
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2" onPointerDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <Label id="harvey-ball-percentage-label">Percentage</Label>
          <span className="text-sm font-medium tabular-nums">{normalized.percentage}%</span>
        </div>
        <Slider
          value={sliderValue}
          onValueChange={handlePercentageSliderChange}
          min={0}
          max={100}
          step={1}
          aria-labelledby="harvey-ball-percentage-label"
        />
      </div>

      <ColorField
        id="harvey-ball-fill-color"
        label="Fill color"
        value={normalized.fillColor}
        onChange={(value) => onChange({ fillColor: value })}
      />

      <ColorField
        id="harvey-ball-background-color"
        label="Background color"
        value={normalized.backgroundColor}
        onChange={(value) => onChange({ backgroundColor: value })}
      />

      <ColorField
        id="harvey-ball-outline-color"
        label="Outline color"
        value={normalized.outlineColor}
        onChange={(value) => onChange({ outlineColor: value })}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="harvey-ball-outline-width">Outline width</Label>
        <Input
          id="harvey-ball-outline-width"
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={normalized.outlineWidth}
          onChange={(event) => {
            const parsed = Number.parseFloat(event.target.value);

            if (Number.isNaN(parsed)) {
              return;
            }

            onChange({ outlineWidth: parsed });
          }}
        />
      </div>
    </div>
  );
}
