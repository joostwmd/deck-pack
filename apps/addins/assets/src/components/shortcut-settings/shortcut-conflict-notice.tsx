import type { ResolvedShortcut } from "@deck-pack/shortcuts";

interface ShortcutConflictNoticeProps {
  internalConflict?: ResolvedShortcut | null;
  powerPointAction?: string | null;
  onAcceptPowerPoint?: () => void;
}

export function ShortcutConflictNotice({
  internalConflict,
  powerPointAction,
  onAcceptPowerPoint,
}: ShortcutConflictNoticeProps) {
  if (internalConflict) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        Already used by &quot;{internalConflict.description}&quot;. Pick a different combination or
        reset that shortcut first.
      </p>
    );
  }

  if (powerPointAction) {
    return (
      <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
        <p>
          PowerPoint already uses this for &quot;{powerPointAction}&quot;. It will only run in the
          add-in while this panel is focused.
        </p>
        {onAcceptPowerPoint ? (
          <button
            type="button"
            className="font-medium underline underline-offset-2"
            onClick={onAcceptPowerPoint}
          >
            Use in add-in anyway
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}
