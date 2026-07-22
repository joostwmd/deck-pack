import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useInsertionStrategy } from "@/hooks/asset-browser/use-insertion-strategy";
import { useInsertSectionShortcutDefs } from "@/hooks/shortcuts/use-resolved-shortcut-defs";
import { useShortcutCommands } from "@/hooks/shortcuts/use-shortcut-commands";
import {
  createHarveyBallMetadata,
  DEFAULT_HARVEY_BALL_CONFIG,
  normalizeHarveyBallConfig,
  serializeHarveyBallSvg,
  validateHarveyBallConfig,
  type HarveyBallConfig,
} from "@/utils/harvey-ball-svg";
import { HARVEY_BALL_EXTERNAL_ID } from "@/utils/insert-harvey-ball";
import { getUserFacingApiErrorMessage } from "@/utils/user-facing-api-error";

export function useHarveyBallsPanelController() {
  const insertionStrategy = useInsertionStrategy();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();
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
      toast.error(getUserFacingApiErrorMessage(error, "Error inserting Harvey ball"));
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
    insertionStrategy?.verb === "Add to canvas" ? "Add to canvas" : "Insert Harvey ball";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return {
    normalizedConfig,
    validation,
    isInserting,
    canInsert: validation.valid && Boolean(insertionStrategy),
    insertLabel,
    insertingLabel,
    handleConfigChange,
    handleInsert,
    insertSectionShortcutDefs,
  };
}

export type HarveyBallsPanelController = ReturnType<typeof useHarveyBallsPanelController>;
