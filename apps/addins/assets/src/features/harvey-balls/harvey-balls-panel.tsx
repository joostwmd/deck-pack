import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { HarveyBallControls } from "@/components/harvey-ball/harvey-ball-controls";
import { HarveyBallPreview } from "@/components/harvey-ball/harvey-ball-preview";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { useShortcutCommands } from "@/hooks/use-shortcut-commands";
import {
  createHarveyBallMetadata,
  DEFAULT_HARVEY_BALL_CONFIG,
  normalizeHarveyBallConfig,
  serializeHarveyBallSvg,
  validateHarveyBallConfig,
  type HarveyBallConfig,
} from "@/lib/harvey-ball-svg";
import { HARVEY_BALL_EXTERNAL_ID } from "@/lib/insert-harvey-ball";

export function HarveyBallsPanel() {
  const insertionStrategy = useInsertionStrategy();
  const [config, setConfig] = useState<HarveyBallConfig>(DEFAULT_HARVEY_BALL_CONFIG);
  const [isInserting, setIsInserting] = useState(false);
  const insertingRef = useRef(false);

  const normalizedConfig = useMemo(() => normalizeHarveyBallConfig(config), [config]);
  const validation = useMemo(() => validateHarveyBallConfig(normalizedConfig), [normalizedConfig]);
  const canInsert = validation.valid && !isInserting && Boolean(insertionStrategy);

  const handleConfigChange = useCallback((next: Partial<HarveyBallConfig>) => {
    setConfig((current) => normalizeHarveyBallConfig({ ...current, ...next }));
  }, []);

  const handleInsert = useCallback(async () => {
    if (insertingRef.current || !validation.valid || !insertionStrategy) {
      return;
    }

    insertingRef.current = true;
    setIsInserting(true);

    try {
      const svg = serializeHarveyBallSvg(normalizedConfig);
      const metadata = createHarveyBallMetadata(normalizedConfig);

      await insertionStrategy.insert({
        variantId: `harvey-ball-${normalizedConfig.percentage}`,
        name: `Harvey ball ${normalizedConfig.percentage}%`,
        imageUrl: "",
        insert: { type: "svg", svg },
        metadata,
        assetType: "harvey_ball",
        externalId: HARVEY_BALL_EXTERNAL_ID,
      });

      toast.success(
        insertionStrategy.verb === "Insert"
          ? "Harvey ball inserted"
          : "Harvey ball added to canvas",
      );
    } catch (error) {
      console.error("Error inserting Harvey ball:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting Harvey ball");
    } finally {
      insertingRef.current = false;
      setIsInserting(false);
    }
  }, [insertionStrategy, normalizedConfig, validation.valid]);

  useShortcutCommands([
    {
      id: "insert",
      execute: () => void handleInsert(),
      enabled: canInsert,
    },
  ]);

  const insertLabel =
    insertionStrategy?.verb === "Add to canvas"
      ? "Add to canvas"
      : "Insert Harvey ball";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

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
          disabled={!validation.valid || !insertionStrategy}
          isInserting={isInserting}
          label={insertLabel}
          insertingLabel={insertingLabel}
          onClick={handleInsert}
        />
      </div>
    </div>
  );
}
