import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@deck-pack/ui/components/system/button";
import { canonicalizeHotkey } from "@deck-pack/shortcuts";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";
import type { Hotkey } from "@tanstack/react-hotkeys";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ShortcutKeys } from "@/components/shortcut-hint";
import { ShortcutConflictNotice } from "@/components/shortcut-settings/shortcut-conflict-notice";
import { ShortcutListHeader } from "@/components/shortcut-settings/shortcut-list";
import { ShortcutRulesDialog } from "@/components/shortcut-settings/shortcut-rules-dialog";
import { getInvalidHotkeyMessage } from "@/components/shortcut-settings/shortcut-rules-help";
import { detectPowerPointConflict } from "@/lib/powerpoint-shortcuts";
import { resolvedShortcutToDef, type ShortcutDef, type ShortcutId } from "@/lib/shortcuts";
import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";
import { useShortcutBindings } from "@/providers/shortcut-bindings-provider";

interface ShortcutEditorProps {
  shortcutId: ShortcutId;
  onBack: () => void;
  onSaved: () => void;
}

export function ShortcutEditor({ shortcutId, onBack, onSaved }: ShortcutEditorProps) {
  const { getShortcut, saveOverride, resetOverride, findLocalConflict, setCapturing } =
    useShortcutBindings();
  const shortcut = getShortcut(shortcutId);
  const def = resolvedShortcutToDef(shortcut);

  const [draftHotkey, setDraftHotkey] = useState<string | undefined>();
  const [acceptedPowerPoint, setAcceptedPowerPoint] = useState(false);
  const [saving, setSaving] = useState(false);

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      setAcceptedPowerPoint(false);
      try {
        setDraftHotkey(canonicalizeHotkey(hotkey));
      } catch (error) {
        toast.error(getInvalidHotkeyMessage(error));
      }
    },
  });

  useEffect(() => {
    setCapturing(recorder.isRecording);
    return () => setCapturing(false);
  }, [recorder.isRecording, setCapturing]);

  useEffect(() => {
    if (!recorder.isRecording) {
      recorder.startRecording();
    }
  }, [recorder]);

  const draftDef = draftHotkey
    ? resolvedShortcutToDef({ ...shortcut, hotkey: draftHotkey })
    : null;

  const internalConflict = useMemo(
    () => (draftHotkey ? findLocalConflict(shortcutId, draftHotkey) : null),
    [draftHotkey, findLocalConflict, shortcutId],
  );

  const powerPointConflict = useMemo(
    () =>
      draftHotkey && !acceptedPowerPoint
        ? detectPowerPointConflict(draftHotkey as Hotkey)
        : null,
    [acceptedPowerPoint, draftHotkey],
  );

  const canSave =
    !!draftHotkey &&
    !internalConflict &&
    (!powerPointConflict || acceptedPowerPoint) &&
    draftHotkey !== shortcut.hotkey &&
    !saving;

  const handleTryAgain = () => {
    setDraftHotkey(undefined);
    setAcceptedPowerPoint(false);
    recorder.startRecording();
  };

  const handleSave = async () => {
    if (!draftHotkey || !canSave) return;

    setSaving(true);
    try {
      await saveOverride(shortcutId, draftHotkey);
      toast.success("Shortcut saved");
      onSaved();
    } catch (error) {
      toast.error(getUserFacingApiErrorMessage(error, "Failed to save shortcut"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetOverride(shortcutId);
      toast.success("Shortcut reset to default");
      onSaved();
    } catch (error) {
      toast.error(getUserFacingApiErrorMessage(error, "Failed to reset shortcut"));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ShortcutListHeader onBack={onBack} />

      <div>
        <h3 className="text-base font-semibold">{def.description}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {draftHotkey ? "Save this combination, or try again." : "Press a new combination."}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <ShortcutComparison label="Current" tokens={def.keys} />
          {draftDef ? (
            <>
              <ArrowRight className="mb-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <ShortcutComparison label="New" tokens={draftDef.keys} emphasized />
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
            {shortcut.isCustomized ? (
              <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => void handleReset()}>
                Reset
              </Button>
            ) : null}
            {draftHotkey ? (
              <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0" onClick={handleTryAgain}>
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ShortcutConflictNotice
        internalConflict={internalConflict}
        powerPointAction={powerPointConflict?.powerPointAction}
        onAcceptPowerPoint={
          powerPointConflict
            ? () => {
                setAcceptedPowerPoint(true);
              }
            : undefined
        }
      />

      <div className="flex items-center justify-between gap-2">
        <ShortcutRulesDialog />
        <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
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
        className={emphasized ? "[&_[data-slot=kbd]]:border-primary/40 [&_[data-slot=kbd]]:bg-primary/5" : undefined}
      />
    </div>
  );
}