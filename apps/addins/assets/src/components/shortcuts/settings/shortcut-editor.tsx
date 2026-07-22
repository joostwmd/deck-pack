import { canonicalizeHotkey } from "@deck-pack/shortcuts";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";
import type { Hotkey } from "@tanstack/react-hotkeys";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ShortcutEditorView } from "@/components/shortcuts/settings/shortcut-editor-view";
import { getInvalidHotkeyMessage } from "@/components/shortcuts/settings/shortcut-rules-help";
import { detectPowerPointConflict } from "@/utils/powerpoint-shortcuts";
import { resolvedShortcutToDef, type ShortcutId } from "@/utils/shortcuts";
import { getUserFacingApiErrorMessage } from "@/utils/user-facing-api-error";
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

  const draftDef = draftHotkey ? resolvedShortcutToDef({ ...shortcut, hotkey: draftHotkey }) : null;

  const internalConflict = useMemo(
    () => (draftHotkey ? findLocalConflict(shortcutId, draftHotkey) : null),
    [draftHotkey, findLocalConflict, shortcutId],
  );

  const powerPointConflict = useMemo(
    () =>
      draftHotkey && !acceptedPowerPoint ? detectPowerPointConflict(draftHotkey as Hotkey) : null,
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
    <ShortcutEditorView
      description={def.description}
      currentKeys={def.keys}
      draftKeys={draftDef?.keys ?? null}
      draftHotkey={draftHotkey}
      isCustomized={shortcut.isCustomized}
      internalConflict={internalConflict}
      powerPointAction={powerPointConflict?.powerPointAction}
      canSave={canSave}
      saving={saving}
      onBack={onBack}
      onTryAgain={handleTryAgain}
      onReset={handleReset}
      onSave={handleSave}
      onAcceptPowerPoint={
        powerPointConflict
          ? () => {
              setAcceptedPowerPoint(true);
            }
          : undefined
      }
    />
  );
}
