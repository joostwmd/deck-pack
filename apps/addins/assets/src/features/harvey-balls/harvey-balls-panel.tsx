import { useHotkeys } from "@tanstack/react-hotkeys";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { HarveyBallControls } from "@/components/harvey-ball/harvey-ball-controls";
import { HarveyBallPreview } from "@/components/harvey-ball/harvey-ball-preview";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import type { AssetPanelMode } from "@/lib/asset-types";
import {
  DEFAULT_HARVEY_BALL_CONFIG,
  normalizeHarveyBallConfig,
  validateHarveyBallConfig,
  type HarveyBallConfig,
} from "@/lib/harvey-ball-svg";
import { insertHarveyBall } from "@/lib/insert-harvey-ball";
import { SHORTCUTS } from "@/lib/shortcuts";

interface HarveyBallsPanelProps {
  mode: AssetPanelMode;
}

export function HarveyBallsPanel({ mode }: HarveyBallsPanelProps) {
  const webCanvas = useWebCanvasOptional();
  const [config, setConfig] = useState<HarveyBallConfig>(DEFAULT_HARVEY_BALL_CONFIG);
  const [isInserting, setIsInserting] = useState(false);
  const insertingRef = useRef(false);

  const normalizedConfig = useMemo(() => normalizeHarveyBallConfig(config), [config]);
  const validation = useMemo(() => validateHarveyBallConfig(normalizedConfig), [normalizedConfig]);
  const canInsert = validation.valid && !isInserting;

  const handleConfigChange = useCallback((next: Partial<HarveyBallConfig>) => {
    setConfig((current) => normalizeHarveyBallConfig({ ...current, ...next }));
  }, []);

  const handleInsert = useCallback(async () => {
    if (insertingRef.current || !validation.valid) {
      return;
    }

    insertingRef.current = true;
    setIsInserting(true);

    try {
      await insertHarveyBall({
        mode,
        config: normalizedConfig,
        webCanvas,
      });

      toast.success(mode === "web" ? "Harvey ball added to canvas" : "Harvey ball inserted");
    } catch (error) {
      console.error("Error inserting Harvey ball:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting Harvey ball");
    } finally {
      insertingRef.current = false;
      setIsInserting(false);
    }
  }, [mode, normalizedConfig, validation.valid, webCanvas]);

  useHotkeys([
    {
      hotkey: SHORTCUTS.insert.hotkey,
      callback: () => void handleInsert(),
      options: {
        enabled: canInsert,
        meta: { name: SHORTCUTS.insert.id, description: SHORTCUTS.insert.description },
      },
    },
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Harvey Balls"
        text="Configure a percentage-filled circle and insert it as an editable SVG."
      />

      <div className="flex flex-col gap-6 px-4 py-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl border bg-muted/30 p-6">
          <HarveyBallPreview config={normalizedConfig} className="size-40" />
          <p className="text-sm text-muted-foreground">
            Live preview updates as you adjust the percentage and colors.
          </p>
        </div>

        <HarveyBallControls config={normalizedConfig} onChange={handleConfigChange} />

        {!validation.valid && validation.message ? (
          <p className="text-sm text-destructive" role="alert">
            {validation.message}
          </p>
        ) : null}

        <InsertSection
          disabled={!validation.valid}
          isInserting={isInserting}
          label={mode === "web" ? "Add to canvas" : "Insert Harvey ball"}
          insertingLabel={mode === "web" ? "Adding..." : "Inserting..."}
          onClick={handleInsert}
        />
      </div>
    </div>
  );
}
