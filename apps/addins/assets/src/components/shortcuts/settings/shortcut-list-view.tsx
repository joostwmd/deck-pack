import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@deck-pack/ui/components/system/button";

import { ResetShortcutsDialog } from "@/components/shortcuts/settings/reset-shortcuts-dialog";
import { ShortcutRulesDialog } from "@/components/shortcuts/settings/shortcut-rules-dialog";
import { ShortcutSettingsSection } from "@/components/shortcuts/settings/shortcut-settings-row";
import type { ShortcutDef, ShortcutId } from "@/lib/shortcuts";

export interface ShortcutListGroup {
  id: string;
  label: string;
  shortcuts: ShortcutDef[];
}

export interface ShortcutListViewProps {
  loadError: string | null;
  onRetry: () => void;
  onEdit: (shortcutId: ShortcutId) => void;
  onResetAll: () => Promise<void>;
  groups: ShortcutListGroup[];
}

export function ShortcutListView({
  loadError,
  onRetry,
  onEdit,
  onResetAll,
  groups,
}: ShortcutListViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {loadError ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
          <p>{loadError}</p>
          <button type="button" className="mt-1 font-medium underline" onClick={() => void onRetry()}>
            Retry
          </button>
        </div>
      ) : null}

      {groups.map((group) => (
        <ShortcutSettingsSection
          key={group.id}
          title={group.label}
          shortcuts={group.shortcuts}
          onEdit={onEdit}
        />
      ))}

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <ShortcutRulesDialog />
        <ResetShortcutsDialog onConfirm={onResetAll} />
      </div>
    </div>
  );
}

export function ShortcutListHeader({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;

  return (
    <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}
