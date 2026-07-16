import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@deck-pack/ui/components/system/button";
import type { ResolvedShortcut } from "@deck-pack/shortcuts";

import { ShortcutKeys } from "@/components/shortcut-hint";
import { ShortcutConflictNotice } from "@/components/shortcut-settings/shortcut-conflict-notice";
import { ShortcutListHeader } from "@/components/shortcut-settings/shortcut-list-view";
import { ShortcutRulesDialog } from "@/components/shortcut-settings/shortcut-rules-dialog";
import type { ShortcutDef } from "@/lib/shortcuts";

export interface ShortcutEditorViewProps {
  description: string;
  currentKeys: ShortcutDef["keys"];
  draftKeys: ShortcutDef["keys"] | null;
  draftHotkey: string | undefined;
  isCustomized: boolean;
  internalConflict: ResolvedShortcut | null;
  powerPointAction: string | undefined;
  canSave: boolean;
  saving: boolean;
  onBack: () => void;
  onTryAgain: () => void;
  onReset: () => void;
  onSave: () => void;
  onAcceptPowerPoint: (() => void) | undefined;
}

export function ShortcutEditorView({
  description,
  currentKeys,
  draftKeys,
  draftHotkey,
  isCustomized,
  internalConflict,
  powerPointAction,
  canSave,
  saving,
  onBack,
  onTryAgain,
  onReset,
  onSave,
  onAcceptPowerPoint,
}: ShortcutEditorViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <ShortcutListHeader onBack={onBack} />

      <div>
        <h3 className="text-base font-semibold">{description}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {draftHotkey ? "Save this combination, or try again." : "Press a new combination."}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <ShortcutComparison label="Current" tokens={currentKeys} />
          {draftKeys ? (
            <>
              <ArrowRight className="mb-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <ShortcutComparison label="New" tokens={draftKeys} emphasized />
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {draftHotkey
              ? "Hold modifiers and one key together."
              : "Listening… hold keys together, then release."}
          </p>
          <div className="flex items-center gap-2">
            {isCustomized ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0"
                onClick={() => void onReset()}
              >
                Reset
              </Button>
            ) : null}
            {draftHotkey ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0"
                onClick={onTryAgain}
              >
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ShortcutConflictNotice
        internalConflict={internalConflict}
        powerPointAction={powerPointAction}
        onAcceptPowerPoint={onAcceptPowerPoint}
      />

      <div className="flex items-center justify-between gap-2">
        <ShortcutRulesDialog />
        <Button type="button" onClick={() => void onSave()} disabled={!canSave}>
          {saving ? "Saving..." : "Save shortcut"}
        </Button>
      </div>
    </div>
  );
}

function ShortcutComparison({
  label,
  tokens,
  emphasized = false,
}: {
  label: string;
  tokens: ShortcutDef["keys"];
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <ShortcutKeys
        tokens={tokens}
        className={
          emphasized
            ? "[&_[data-slot=kbd]]:border-primary/40 [&_[data-slot=kbd]]:bg-primary/5"
            : undefined
        }
      />
    </div>
  );
}
