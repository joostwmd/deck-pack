import { Button } from "@deck-pack/ui/components/system/button";
import { Checkbox } from "@deck-pack/ui/components/system/checkbox";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import { Slider } from "@deck-pack/ui/components/system/slider";
import { captureSelectedTextStyle } from "@deck-pack/office-js";
import type { BrandProfileConfiguration } from "@deck-pack/presentation-check";
import { RULE_PRESETS, applyRulePreset } from "@deck-pack/presentation-check";
import { useState } from "react";
import { toast } from "sonner";

import { PowerPointGuard } from "@/components/shell/power-point-guard";

interface BrandProfileEditorProps {
  configuration: BrandProfileConfiguration;
  onChange: (configuration: BrandProfileConfiguration) => void;
}

export function BrandProfileEditor({ configuration, onChange }: BrandProfileEditorProps) {
  const [capturing, setCapturing] = useState(false);

  const updateRoleFont = (
    role: "title" | "body",
    font: string,
  ) => {
    onChange({
      ...configuration,
      typography: {
        ...configuration.typography,
        roles: {
          ...configuration.typography.roles,
          [role]: {
            ...configuration.typography.roles[role],
            allowedFonts: font
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
          },
        },
      },
    });
  };

  const enabledRuleCount = Object.values(configuration.rules).filter((rule) => rule.enabled).length;
  const margins = configuration.layout?.safeMargins ?? { top: 24, right: 24, bottom: 24, left: 24 };

  const handleCaptureSelection = async (target: "title-font" | "body-font" | "color") => {
    setCapturing(true);
    try {
      const captured = await captureSelectedTextStyle();
      if (target === "color") {
        const hex = captured.fontColor ?? captured.fillColor;
        if (!hex) {
          toast.error("No color found on the selected object.");
          return;
        }
        const palette = [...configuration.colors.palette];
        if (palette[0]) {
          palette[0] = { ...palette[0], hex };
        }
        onChange({ ...configuration, colors: { ...configuration.colors, palette } });
        toast.success("Captured color from selection");
        return;
      }

      const font = captured.fontName;
      if (!font) {
        toast.error("No font found on the selected text.");
        return;
      }

      const role = target === "title-font" ? "title" : "body";
      updateRoleFont(role, font);
      toast.success(`Captured ${role} font from selection`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to capture selection");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Typography</h3>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title-fonts">Title fonts</Label>
          <div className="flex gap-2">
            <Input
              id="title-fonts"
              value={configuration.typography.roles.title.allowedFonts.join(", ")}
              onChange={(event) => updateRoleFont("title", event.target.value)}
            />
            <PowerPointGuard powerpointRequired>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={capturing}
                onClick={() => void handleCaptureSelection("title-font")}
              >
                Use selected
              </Button>
            </PowerPointGuard>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="body-fonts">Body fonts</Label>
          <div className="flex gap-2">
            <Input
              id="body-fonts"
              value={configuration.typography.roles.body.allowedFonts.join(", ")}
              onChange={(event) => updateRoleFont("body", event.target.value)}
            />
            <PowerPointGuard powerpointRequired>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={capturing}
                onClick={() => void handleCaptureSelection("body-font")}
              >
                Use selected
              </Button>
            </PowerPointGuard>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fallback-fonts">Fallback fonts</Label>
          <Input
            id="fallback-fonts"
            value={configuration.typography.fallbackFonts.join(", ")}
            onChange={(event) =>
              onChange({
                ...configuration,
                typography: {
                  ...configuration.typography,
                  fallbackFonts: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Colors</h3>
          <PowerPointGuard powerpointRequired>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={capturing}
              onClick={() => void handleCaptureSelection("color")}
            >
              Use selected color
            </Button>
          </PowerPointGuard>
        </div>
        {configuration.colors.palette.map((token, index) => (
          <div key={token.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
            <Input
              value={token.name}
              onChange={(event) => {
                const palette = [...configuration.colors.palette];
                palette[index] = { ...token, name: event.target.value };
                onChange({
                  ...configuration,
                  colors: { ...configuration.colors, palette },
                });
              }}
            />
            <Input
              className="w-28 font-mono text-xs"
              value={token.hex}
              onChange={(event) => {
                const palette = [...configuration.colors.palette];
                palette[index] = { ...token, hex: event.target.value };
                onChange({
                  ...configuration,
                  colors: { ...configuration.colors, palette },
                });
              }}
            />
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <Label>Similar color tolerance</Label>
          <Slider
            min={0}
            max={40}
            step={1}
            value={[configuration.colors.maximumColorDistance]}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              onChange({
                ...configuration,
                colors: {
                  ...configuration.colors,
                  maximumColorDistance:
                    typeof next === "number" ? next : configuration.colors.maximumColorDistance,
                },
              });
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Layout</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-1">
              <Label className="capitalize">{side} margin</Label>
              <Input
                type="number"
                min={0}
                value={margins[side]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onChange({
                    ...configuration,
                    layout: {
                      ...configuration.layout,
                      safeMargins: { ...margins, [side]: Number.isFinite(value) ? value : 0 },
                    },
                  });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rules</h3>
          <span className="text-xs text-muted-foreground">{enabledRuleCount} enabled</span>
        </div>
        <Select
          onValueChange={(value) =>
            onChange(
              applyRulePreset(value as keyof typeof RULE_PRESETS, configuration),
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Apply preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="essential">Essential</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="strict">Strict</SelectItem>
          </SelectContent>
        </Select>
        {Object.entries(configuration.rules).map(([ruleId, rule]) => (
          <div key={ruleId} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">{ruleId}</p>
              <p className="text-xs text-muted-foreground capitalize">{rule.severity}</p>
            </div>
            <Checkbox
              checked={rule.enabled}
              onCheckedChange={(checked) =>
                onChange({
                  ...configuration,
                  rules: {
                    ...configuration.rules,
                    [ruleId]: { ...rule, enabled: checked === true },
                  },
                })
              }
            />
          </div>
        ))}
      </section>
    </div>
  );
}
