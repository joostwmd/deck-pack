import { HarveyBallControls } from "@/components/harvey-ball/harvey-ball-controls";
import { HarveyBallPreview } from "@/components/harvey-ball/harvey-ball-preview";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";

import type { HarveyBallsPanelController } from "./use-harvey-balls-panel-controller";

export interface HarveyBallsPanelViewProps {
  controller: HarveyBallsPanelController;
}

export function HarveyBallsPanelView({ controller }: HarveyBallsPanelViewProps) {
  const {
    normalizedConfig,
    validation,
    isInserting,
    canInsert,
    insertLabel,
    insertingLabel,
    handleConfigChange,
    handleInsert,
    insertSectionShortcutDefs,
  } = controller;

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
          disabled={!canInsert}
          isInserting={isInserting}
          label={insertLabel}
          insertingLabel={insertingLabel}
          shortcutDefs={insertSectionShortcutDefs}
          onClick={handleInsert}
        />
      </div>
    </div>
  );
}
